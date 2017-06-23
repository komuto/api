import { Facebook } from 'fb';
import passport from 'passport';
import { User, UserToken, TokenType } from './model';
import { UserEmail } from './email';
import config from '../../../config';
import { BadRequestError } from '../../../common/errors';

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
  const { provider_name: providerName, provider_uid: uid, access_token } = req.body;
  req.user = await User.getBySocial(providerName, uid);
  // Case where provider name and uid not found on db
  if (!req.user) {
    fb.setAccessToken(access_token);
    const response = await fb.api(uid, { fields: 'id,name,email,gender,picture.type(large)' });
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
  req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  await User.update({ id_users: req.user.id }, User.matchDBColumn(req.body));
  return next();
};

/**
 * Update user password
 */
UserController.updatePassword = async (req, res, next) => {
  const user = await new User({ email_users: req.body.email }).fetch();
  if (!user) {
    throw new BadRequestError('Invalid user.');
  }
  if (await user.checkPassword(req.body.old_password)) {
    const password = User.hashPasswordSync(req.body.password);
    await User.update({ id_users: user.get('id_users') }, { password_users: password });
  }
  return next();
};

/**
 * Create user
 */
UserController.createUser = async (req, res, next) => {
  let user = await User.getByEmail(req.body.email);
  if (user) {
    throw new BadRequestError('Email sudah terdaftar.');
  }
  const password = req.body.password;
  req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  req.body.password = User.hashPasswordSync(req.body.password);
  user = await User.create(User.matchDBColumn(req.body));
  const token = await UserToken.generateToken(user.id, TokenType.EMAIL_ACTIVATION);
  UserEmail.send(UserEmail.buildActivation(user.email, token));
  req.body.password = password;
  return next();
};

/**
 * Get profile
 */
UserController.getProfile = async (req, res, next) => {
  const user = await User.getProfile(req.user.id);
  req.resData = {
    message: 'User Profile',
    data: user,
  };
  return next();
};

UserController.forgotPassword = async (req, res, next) => {
  const user = await User.getByEmail(req.body.email);
  if (!user) {
    throw new BadRequestError('Email belum terdaftar');
  }
  const token = await UserToken.generateToken(user.id, TokenType.FORGOT_PASSWORD);
  UserEmail.send(UserEmail.buildForgotPassword(req.body.email, token));
  return next();
};

UserController.checkEmail = async (req, res, next) => {
  const user = await User.getByEmail(req.body.email);
  if (user) {
    throw new BadRequestError('Email sudah terdaftar');
  }
  req.resData = { message: 'Email Available' };
  return next();
};

UserController.activateUser = async (req, res, next) => {
  const id = await UserToken.getId(req.query.token, TokenType.EMAIL_ACTIVATION);
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
    status: true,
    message: 'Products Wishlist Data',
    data: products,
  };
  return next();
};

