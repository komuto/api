import { Facebook } from 'fb';
import passport from 'passport';
import moment from 'moment';
import _ from 'lodash';
import { User, UserToken, TokenType, OTP, OTPStatus } from './model';
import { UserEmail } from './email';
import { utils } from '../core';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';
import { model } from '../store';
import { registrationMsg, updateMsg, emailMsg, activateMsg, resetPassMsg, tokenMsg, loginMsg, fbMsg, passwordMsg, OTPMsg, phoneNumberMsg } from './message';
import { Address } from '../address/model';
import { Discussion } from '../product/model';

const fb = new Facebook(config.fb);
const { formatSingularErr } = utils;
const { Store, Catalog, StoreExpedition } = model;

export const UserController = {};
export default { UserController };

function formatFbError(code, e) {
  const session = [102, 190, 458, 459, 460, 463, 464, 467];
  const down = [1, 2, 4, 17, 341, 368];
  if (session.includes(code) || code === 'OAuthException') return formatSingularErr('session', fbMsg.session_expired);
  else if (down.includes(code)) return fbMsg.api_down;
  // code 10 and 200-299 for not granted permission
  else if (code === 10 || (code >= 200 && code < 300)) return formatSingularErr('permission', fbMsg.permission_denied);
  // Code outside above range, use original fb message
  return e.message;
}

async function getFbData(uid) {
  try {
    return await fb.api(uid, { fields: 'id,name,email,gender,picture.type(large)' });
  } catch (e) {
    const error = e.response.error;
    throw new BadRequestError(
      loginMsg.title,
      formatFbError(error.code ? error.code : error.type, error));
  }
}

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
  const { provider_name: providerName, provider_uid: uid, access_token } = req.body;
  req.user = await User.getBySocial(providerName, uid);
  // Case where provider name and uid not found on db
  if (!req.user) {
    fb.setAccessToken(access_token);
    const response = await getFbData(uid);
    const user = await User.getByEmail(response.email);
    // Case where user already created but provider name and uid do not match
    if (user) {
      await User.update(
        { id_users: user.id },
        {
          hybridauth_provider_name: providerName,
          hybridauth_provider_uid: uid,
        });
      user.provider_name = providerName;
      user.provider_uid = uid;
      req.user = user;
    } else { // Case where user has not been created
      response.provider_name = providerName;
      response.provider_uid = response.id;
      response.gender = (response.gender === 'male') ? 'L' : 'P';
      response.password = User.hashPasswordSync('komuto');
      response.photo = response.picture.data.url;
      response.status = '1';
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
  if (_.isEmpty(data)) {
    throw new BadRequestError(updateMsg.title, formatSingularErr('field', updateMsg.not_valid));
  }
  await User.update({ id_users: req.user.id }, data);
  return next();
};

UserController.updateAccount = async (req, res, next) => {
  if (req.body.gender) req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  if (req.body.date_of_birth) req.body.date_of_birth = moment.unix(req.body.date_of_birth);
  const { name, photo, gender, place_of_birth, date_of_birth } = req.body;
  const check = { name, photo, gender, place_of_birth, date_of_birth };
  const data = User.matchDBColumn(check);
  if (_.isEmpty(data)) {
    throw new BadRequestError(updateMsg.title, formatSingularErr('field', updateMsg.not_valid));
  }
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
  } else {
    throw new BadRequestError(resetPassMsg.title, formatSingularErr('password', passwordMsg.not_match));
  }
  return next();
};

/**
 * Create user
 */
UserController.createUser = async (req, res, next) => {
  let user = await User.getByEmail(req.body.email);
  if (user) {
    throw new BadRequestError(registrationMsg.title, formatSingularErr('email', emailMsg.duplicate));
  }
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
  if (!user) {
    throw new BadRequestError(updateMsg.title, formatSingularErr('email', emailMsg.not_found));
  }
  const token = await UserToken.generateToken(user.id, TokenType.FORGOT_PASSWORD);
  UserEmail.sendForgotPassword(req.body.email, token);
  return next();
};

UserController.checkEmail = async (req, res, next) => {
  const user = await User.getByEmail(req.body.email);
  if (user) {
    throw new BadRequestError(registrationMsg.title, formatSingularErr('email', emailMsg.not_available));
  }
  req.resData = { message: 'Email Available' };
  return next();
};

UserController.activateUser = async (req, res, next) => {
  const id = await UserToken.getId(req.query.token, TokenType.EMAIL_ACTIVATION);
  if (!id) throw new BadRequestError(activateMsg.title, formatSingularErr('token', tokenMsg.not_valid));
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
  if (!req.id) throw new BadRequestError(resetPassMsg.title, formatSingularErr('token', tokenMsg.not_valid));
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
 * Get store catalog
 */
UserController.getUserCatalog = async (req, res, next) => {
  const catalogs = await Catalog.getUserCatalog(req.user.id);
  req.resData = {
    message: 'Store Catalog Data',
    data: catalogs,
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

/**
 * Get store expedition manage
 */
UserController.createStore = async (req, res, next) => {
  const expeditionServices = req.body.expedition_services;
  const storeData = _.assign(req.body.store, {
    user_id: req.user.id,
    status: 1,
    seller_theme_id: 0,
    store_id_number: req.body.user.id_number,
    created_at: moment(),
    status_at: moment(),
  });
  const store = await Store.create(Store.matchDBColumn(storeData));
  const user = await User.update({ id_users: req.user.id }, User.matchDBColumn(req.body.user));
  const addressData = _.assign(req.body.address, {
    is_sale_address: 1,
    is_primary: 0,
    is_tender_address: 0,
    user_id: req.user.id,
    alias_address: req.body.address.address,
  });
  const address = await Address.create(Address.matchDBColumn(addressData));
  const services = expeditionServices.map(data => (StoreExpedition.matchDBColumn(data, true)));
  await Store.createExpeditionServices(store, services);

  req.resData = {
    message: 'Store Data',
    data: { store, user, address, expedition_services: expeditionServices },
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

UserController.sendSms = async (req, res, next) => {
  if (!req.user.phone_number) throw new BadRequestError(OTPMsg.title, formatSingularErr('phone_number', phoneNumberMsg.not_available));
  const data = { id_users: req.user.id, no_hp: req.user.phone_number, status: OTPStatus.DRAFT };
  // check if otp is already created
  let otp = await OTP.query(qb => qb.where(data).andWhere('date_expired', '>', moment())).fetch();
  if (!otp) otp = await OTP.create(data);
  await otp.sendSms();
  await otp.save({ status: OTPStatus.SENT });
  return next();
};

/**
 * Verify OTP code
 * wrapped on another function to give ability to decide what error message to use
 * @param errTitle {string}
 */
UserController.verifyOTPCode = errTitle => async (req, res, next) => {
  const data = { id_users: req.user.id, no_hp: req.user.phone_number, kode: req.body.code };
  const status = OTPStatus.USED;
  const otp = await OTP.query(qb => qb.where(data).andWhereNot({ status }).andWhere('date_expired', '>', moment())).fetch();
  if (!otp) throw new BadRequestError(errTitle, formatSingularErr('code', OTPMsg.not_found));
  await otp.save({ status });
  return next();
};

/**
 * Get user discussions
 */
UserController.getDiscussions = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const discussions = await Discussion.getByUserId(req.user.id, page, pageSize);
  req.resData = {
    message: 'Discussion Data',
    meta: { page, limit: pageSize },
    data: discussions,
  };
  return next();
};

