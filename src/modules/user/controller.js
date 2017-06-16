import { Facebook } from 'fb';
import { User } from './model';
import config from '../../../config';

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

UserController.getUserSocial = async (req, res, next) => {
  // Case where provider name and uid found on db
  const { provider_name: name, provider_uid: uid, access_token } = req.body;
  req.user = await User.getBySocial(name, uid);
  // Case where provider name and uid not found on db
  if (!req.user) {
    fb.setAccessToken(access_token);
    const response = await fb.api(uid, { fields: 'id,name,email,gender,picture.type(large)' });
    const user = await User.getByEmail(response.email);
    // Case where user already created but provider name and uid do not match
    if (user) {
      const updatedUser = await User.update(
        { email_users: user.email },
        {
          hybridauth_provider_name: name,
          hybridauth_provider_uid: uid,
        },
      );
      user.provider_name = updatedUser.provider_name;
      user.provider_uid = updatedUser.provider_uid;
      req.user = user;
    } else { // Case where user has not been created
      const data = {
        hybridauth_provider_name: name,
        hybridauth_provider_uid: response.id,
        email_users: response.email,
        namalengkap_users: response.name,
        jeniskelamin_users: (response.gender === 'male') ? 'L' : 'P',
        password_users: User.hashPasswordSync('komuto'),
        pathfoto_users: response.picture.data.url,
      };
      req.user = await User.create(data);
    }
  }
  req.user.is_required_password = true;
  return next();
};

/**
 * Create user
 */
UserController.createUser = async (req, res, next) => {
  const { name, email, phone_number, password, gender } = req.body;
  const hash = User.hashPasswordSync(password);
  const user = await User.create({
    namalengkap_users: name,
    email_users: email,
    nohp_users: phone_number,
    jeniskelamin_users: gender,
    password_users: hash,
  });
  if (!user) {
    const err = new Error('Email sudah terdaftar.');
    next(err);
  }
  delete user.password_users;
  req.resData = {
    status: true,
    message: 'User Data',
    data: user,
  };
  return next();
};
