import { Facebook } from 'fb';
import passport from 'passport';
import moment from 'moment';
import _ from 'lodash';
import {
  User,
  UserToken,
  TokenType,
  UserStatus,
  getNotification,
  NotificationType,
  ResolutionCenter,
  ResolutionCenterStatus,
  ImageGroup,
  Wishlist,
} from './model';
import { UserEmail } from './email';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';
import { Store, StoreExpedition, Message, MessageFlagStatus, DetailMessage } from './../store/model';
import {
  userUpdateError,
  resetPassError,
  registrationError,
  activateUserError,
  fbError,
  getResolutionError,
} from './messages';
import { Discussion, Product } from '../product/model';
import core from '../core';

const { Notification, sellerNotification } = core;

const fb = new Facebook(config.fb);

export const UserController = {};
export default { UserController };

/**
 * View user
 */
UserController.getOneUser = async (req, res, next) => {
  req.user = await User.getById(req.params.id);
  return next();
};

/**
 * Login authentication
 */
UserController.login = async (req, res, next) => {
  passport.authenticate('local-login', async (err, user) => {
    if (err) {
      return next(err);
    }
    if (req.body.reg_token) {
      await User.where('id_users', user.id).save({ reg_token: req.body.reg_token }, { patch: true });
      user.reg_token = req.body.reg_token;
    }
    req.user = user;
    return next();
  })(req, res, next);
};

/**
 * Get user via social media
 */
UserController.getUserSocial = async (req, res, next) => {
  // Case where provider name and uid found on db
  const { provider_name, provider_uid, access_token, reg_token } = req.body;
  req.user = await User.getBySocial(provider_name, provider_uid);
  // Case where provider name and uid not found on db
  if (!req.user) {
    fb.setAccessToken(access_token);
    let response = await fb.api(provider_uid, { fields: 'id,name,email,gender,picture.type(large)' })
      .catch(e => fbError(e.response.error));
    if (response instanceof BadRequestError) throw response;
    const user = await User.getByEmail(response.email);
    // Case where user already created but provider name and uid do not match
    if (user) {
      await user.save({
        hybridauth_provider_name: provider_name,
        hybridauth_provider_uid: provider_uid,
        reg_token,
      }, { patch: true });
      req.user = user.serialize();
    } else { // Case where user has not been created
      response = {
        ...response,
        provider_name,
        provider_uid,
        gender: (response.gender === 'male') ? 'L' : 'P',
        password: User.hashPasswordSync('komuto'),
        photo: response.picture.data.url,
        status: UserStatus.ACTIVE,
        marketplace_id: req.marketplace.id,
      };
      req.user = await User.create(User.matchDBColumn(response));
    }
  }
  req.user.is_required_password = true;
  return next();
};

UserController.getBalance = (req, res, next) => {
  req.resData = {
    message: 'User Balance Data',
    data: { user_balance: req.user.saldo_wallet },
  };
  return next();
};

/**
 * Update user
 */
UserController.updateUser = async (req, res, next) => {
  if (req.body.gender) req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  if (req.body.date_of_birth) req.body.date_of_birth = moment.unix(req.body.date_of_birth);
  // eslint-disable-next-line
  const { name, cooperative_member_number, photo, gender, date_of_birth, place_of_birth } = req.body;
  // eslint-disable-next-line
  const check = { name, cooperative_member_number, photo, gender, place_of_birth, date_of_birth };
  const data = User.matchDBColumn(check);
  if (_.isEmpty(data)) throw userUpdateError('fields', 'not_valid');
  await User.update({ id_users: req.user.id }, data);
  return next();
};

UserController.updateAccount = async (req, res, next) => {
  if (req.body.gender) req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  if (req.body.date_of_birth) req.body.date_of_birth = moment.unix(req.body.date_of_birth);
  const { name, photo, gender, place_of_birth, date_of_birth } = req.body;
  const check = { name, photo, gender, place_of_birth, date_of_birth };
  const data = User.matchDBColumn(check);
  if (_.isEmpty(data)) throw userUpdateError('fields', 'not_valid');
  await User.update({ id_users: req.user.id }, data);
  return next();
};

/**
 * Update user password
 */
UserController.updatePassword = async (req, res, next) => {
  const check = await User.checkPasswordFromApi(req.body.old_password, req.user.password);
  if (check) {
    const password = User.hashPasswordSync(req.body.password);
    await User.update({ id_users: req.user.id }, { password_users: password });
  } else throw resetPassError('password', 'not_match');
  return next();
};

/**
 * Create user
 */
UserController.createUser = async (req, res, next) => {
  let user = await User.getByEmail(req.body.email);
  if (user) throw registrationError('email', 'duplicate_email');
  const password = req.body.password;
  req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  req.body.password = User.hashPasswordSync(req.body.password);
  req.body.marketplace_id = req.marketplace.id;
  user = await User.create(User.matchDBColumn(req.body));
  const token = await UserToken.generateToken(user.id, TokenType.EMAIL_ACTIVATION);
  UserEmail.sendActivateAccount(user.email, token);
  req.body.password = password;
  return next();
};

/**
 * Get user profile
 */
UserController.getUserProfile = async (req, res, next) => {
  const user = await User.getUserProfile(req.user.id);
  req.resData = {
    message: 'User Profile',
    data: user,
  };
  return next();
};

UserController.getAccountProfile = async (req, res, next) => {
  const { id, name, photo, gender, place_of_birth, date_of_birth } = req.user;
  const birthPlace = await User.getBirthPlace(place_of_birth);
  req.resData = {
    message: 'Profile Data',
    data: {
      id,
      name,
      photo,
      gender,
      date_of_birth,
      place_of_birth: birthPlace,
      place_of_birth_id: req.user.place_of_birth,
    },
  };
  return next();
};

UserController.forgotPassword = async (req, res, next) => {
  const user = await User.getByEmail(req.body.email);
  if (!user) throw resetPassError('email', 'email_not_found');
  const token = await UserToken.generateToken(user.id, TokenType.FORGOT_PASSWORD);
  UserEmail.sendForgotPassword(req.body.email, token);
  return next();
};

UserController.activateUser = async (req, res, next) => {
  const id = await UserToken.getId(req.query.token, TokenType.EMAIL_ACTIVATION);
  if (!id) throw activateUserError('token', 'token_not_valid');
  await User.activate(id);
  await UserToken.expire(req.query.token);
  return next();
};

/**
 * Check whether active forgot password token exists
 */
UserController.checkToken = async (req, res, next) => {
  const token = req.query.token || req.body.token;
  req.id = await UserToken.getId(token, TokenType.FORGOT_PASSWORD);
  if (!req.id) throw resetPassError('token', 'token_not_valid');
  req.token = token;
  return next();
};

/**
 * Reset password
 */
UserController.resetPassword = async (req, res, next) => {
  const password = User.hashPasswordSync(req.body.password);
  await User.update({ id_users: req.id }, { password_users: password });
  await UserToken.expire(req.token);
  return next();
};

/**
 * Get wishlist
 */
UserController.getWishlist = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const params = { sort: req.query.sort, query: req.query.q };
  const products = await Wishlist.get(req.user.id, params, page, pageSize);
  req.resData = {
    message: 'Products Wishlist Data',
    meta: { page, limit: pageSize },
    data: products,
  };
  return next();
};

/**
* Update expeditions
*/
UserController.updateExpeditions = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const collection = req.body.map((data) => {
    data.store_id = storeId;
    return StoreExpedition.matchDBColumn(data, true);
  });
  await StoreExpedition.updateBatch(collection);
  return next();
};

/**
 * Get store expedition
 */
UserController.getUserExpeditions = async (req, res, next) => {
  const expeditions = await Store.getUserExpeditions(req.user.id);
  req.resData = {
    message: 'Store Expeditions Data',
    data: expeditions,
  };
  return next();
};

/**
 * Get store expedition manage
 */
UserController.getUserExpeditionsManage = async (req, res, next) => {
  const expeditions = await Store.getUserExpeditionsManage(req.user.id);
  req.resData = {
    message: 'Store Expeditions Manage Data',
    data: expeditions,
  };
  return next();
};

UserController.getPhone = (req, res, next) => {
  const { phone_number } = req.user;
  req.resData = {
    message: 'Phone Number Data',
    data: { phone_number },
  };
  return next();
};

UserController.updatePhone = async (req, res, next) => {
  const { phone_number: nohp_users } = req.body;
  await User.update({ id_users: req.user.id }, { nohp_users });
  return next();
};

/**
 * Get user discussions
 */
UserController.getDiscussions = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const discussions = await Discussion.get(req.user.id, page, pageSize);
  req.resData = {
    message: 'Discussion Data',
    meta: { page, limit: pageSize },
    data: discussions,
  };
  return next();
};

/**
 * Get store discussions
 */
UserController.getStoreDiscussions = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const productIds = await Product.getIdsByStoreId(storeId);
  const discussions = await Discussion.get(productIds, page, pageSize, true);
  req.resData = {
    message: 'Discussion Data',
    meta: { page, limit: pageSize },
    data: discussions,
  };
  return next();
};

/**
 * Get Messages
 */
UserController.getMessages = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const isArchived = req.query.is_archived ? req.query.is_archived : false;
  const messages = await Message.getById(req.user.id, 'user', JSON.parse(isArchived), page, pageSize);
  req.resData = {
    message: 'Message Data',
    meta: { page, limit: pageSize },
    data: messages,
  };
  return next();
};

/**
 * Get Detail Message
 */
UserController.getMessage = async (req, res, next) => {
  const message = await Message.findById(req.params.id, req.user.id, 'user');
  req.resData = {
    message: 'Detail Message Data',
    data: message,
  };
  return next();
};

/**
 * Update Flag Message
 */
UserController.updateMessage = async (req, res, next) => {
  const flag = req.body.type === 'archive' ? MessageFlagStatus.ARCHIVE : MessageFlagStatus.READ;
  const message = await Message.updateFlag(req.params.id, req.user.id, 'user', flag);
  req.resData = { data: message };
  return next();
};

/**
 * Delete Message
 */
UserController.deleteMessage = async (req, res, next) => {
  await Message.updateFlag(req.params.id, req.user.id, 'user', MessageFlagStatus.PERMANENT_DELETED);
  return next();
};

/**
 * Reply Message
 */
UserController.replyMessage = async (req, res, next) => {
  const msg = await Message.findById(req.params.id, req.user.id, 'user');
  const data = DetailMessage.matchDBColumn(_.assign(req.body, {
    message_id: req.params.id,
    user_id: req.user.id,
    created_at: moment(),
  }));
  const detailMessage = await DetailMessage.create(data);
  const storeOwner = await User.getById(msg.store.user_id);
  const notifications = storeOwner.serialize({ notification: true }).notifications;
  if (storeOwner.get('reg_token') && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
    Notification.send(sellerNotification.MESSAGE, {
      token: storeOwner.get('reg_token'),
      id: req.params.id,
    });
  }
  const user = {
    id: req.user.id,
    name: req.user.name,
    photo: req.user.photo,
  };
  req.resData = { data: { ...detailMessage.serialize(), user, store: null } };
  return next();
};

/**
 * Update Registration Token
 */
UserController.updateRegToken = async (req, res, next) => {
  const user = await User.updateRegToken(req.user.id, req.body.reg_token);
  req.resData = { data: user };
  return next();
};

/**
 * Get Notification Configuration
 */
UserController.getNotifications = async (req, res, next) => {
  const notification = User.getNotifications(req.user.notifications, req.marketplace.name);
  req.resData = {
    message: 'Notification Configuration',
    data: notification,
  };
  return next();
};

/**
 * Save Notification Configuration
 */
UserController.saveNotifications = async (req, res, next) => {
  const notifications = req.body.notifications;
  await User.where({ id_users: req.user.id }).save({ notifications }, { patch: true });
  req.resData = { data: User.getNotifications(notifications, req.marketplace.name) };
  return next();
};

/**
 * Get Resolutions
 */
UserController.getResolutions = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const isClosed = req.query.is_closed ? JSON.parse(req.query.is_closed) : false;
  const resolutions = await ResolutionCenter.get(req.user.id, isClosed, page, pageSize);
  req.resData = {
    message: 'Resolution Data',
    meta: { page, limit: pageSize },
    data: resolutions.map(val => val.serialize({ minimal: true })),
  };
  return next();
};

/**
 * Get Detail Resolution
 */
UserController.getResolution = async (req, res, next) => {
  const resolution = await ResolutionCenter.getDetail(req.user.id, req.params.id);
  if (!resolution) throw getResolutionError('resolution_center', 'not_found');
  req.resData = {
    message: 'Resolution Data',
    data: resolution.serialize({ minimal: false }, req.user.name),
  };
  return next();
};

/**
 * Create Resolution
 */
UserController.createResolution = async (req, res, next) => {
  const ticketNumber = await ResolutionCenter.getTicketNumber();
  const data = ResolutionCenter.matchDBColumn({
    ...req.body,
    user_id: req.user.id,
    discussions: ResolutionCenter.createDiscussion(req.user.name, req.body.message),
    ticket_number: ticketNumber,
    status: ResolutionCenterStatus.WAIT_TO_REPLY,
    status_at: moment(),
    ends_at: moment(),
    created_at: moment(),
  });
  const resolution = await ResolutionCenter.create(data);
  if (req.body.images) await ImageGroup.bulkCreate(resolution.get('id_rescenter'), req.body.images);
  req.resData = { data: resolution.serialize({ minimal: true }) };
  return next();
};

/**
 * Reply Resolution
 */
UserController.replyResolution = async (req, res, next) => {
  const resolution = await ResolutionCenter.getDetail(req.user.id, req.params.id);
  if (!resolution) throw getResolutionError('resolution_center', 'not_found');
  const discussions = resolution.pushMessage(req.user.name, req.body.message);
  await resolution.save({ isipesan_rescenter: discussions, update_at: moment() }, { patch: true });
  req.resData = {
    message: 'Resolution Data',
    data: resolution.serialize({ minimal: false }, req.user.name),
  };
  return next();
};
