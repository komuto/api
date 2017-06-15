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
  const user = req.user;

  const data = req.body;

  console.log(data);

  // let newUser = await User.create({
  //   user_id: user.user_id,
  // });
  delete user.password_users;
  req.resData = {
    status: true,
    message: 'User Data',
    data: user,
  };
  return next();
};
