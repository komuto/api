import { Facebook } from 'fb';
import { User } from './model';
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
      const updatedUser = await User.update(
        { id_users: user.id },
        {
          hybridauth_provider_name: providerName,
          hybridauth_provider_uid: uid,
        });
      user.provider_name = updatedUser.provider_name;
      user.provider_uid = updatedUser.provider_uid;
      req.user = user;
    } else { // Case where user has not been created
      response.provider_name = providerName;
      response.provider_uid = response.id;
      response.gender = (response.gender === 'male') ? 'L' : 'P';
      response.password = User.hashPasswordSync('komuto');
      response.photo = response.picture.data.url;
      req.user = await User.create(User.matchDBColumn(response));
    }
  }
  req.user.is_required_password = true;
  return next();
};

UserController.getBalance = (req, res, next) => {
  req.resData = {
    status: true,
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
  req.user = await User.getById(req.user.id);
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
    req.user = user.serialize();
  }
  return next();
};

/**
 * Create user
 */
UserController.createUser = async (req, res, next) => {
  const user = await User.getByEmail(req.body.email);
  if (user) {
    throw new BadRequestError('Email sudah terdaftar.');
  }
  req.body.gender = (req.body.gender === 'male') ? 'L' : 'P';
  req.body.password = User.hashPasswordSync(req.body.password);
  req.user = await User.create(User.matchDBColumn(req.body));
  return next();
};
