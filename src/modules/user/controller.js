import { User } from './model';

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
  req.user = await User.getBySocial(req.body.provider_name, req.body.provider_uid);
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
  delete user.password_users;
  req.resData = {
    status: true,
    message: 'User Data',
    data: user,
  };
  return next();
};
