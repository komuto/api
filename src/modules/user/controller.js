import { Facebook } from 'fb';
import passport from 'passport';
import moment from 'moment';
import _ from 'lodash';
import { User, UserToken, TokenType, UserStatus } from './model';
import { UserEmail } from './email';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';
import { Store, StoreExpedition } from './../store/model';
import { userUpdateError, resetPassError, registrationError, activateUserError, fbError } from './messages';
import { Discussion, Product } from '../product/model';

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
UserController.login = (req, res, next) => {
  passport.authenticate('local-login', (err, user) => {
    if (err) {
      return next(err);
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
  const { provider_name, provider_uid, access_token } = req.body;
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
    data: { id, name, photo, gender, place_of_birth: birthPlace, date_of_birth },
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
  const products = await User.getWishlist(req.user.id);
  req.resData = {
    message: 'Products Wishlist Data',
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
  const expeditions = await Store.getUserExpeditions(req.user.id, true);
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
