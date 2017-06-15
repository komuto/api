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

