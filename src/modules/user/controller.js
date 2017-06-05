import jwt from 'jsonwebtoken';
import moment from 'moment';
import { User } from './model';
import { jwt as jwtOptions } from '../../../config';

export const UserController = {};
export default { UserController };

/**
 * View user
 */
UserController.getUser = async (req, res, next) => {
  let profile = req.user;
  if (req.params.id) {
    profile = await User.getById(req.params.id);
    profile = profile ? profile.toJSON() : profile;
  }

  if (!profile) {
    const err = new Error('Invalid user');
    return next(err);
  }

  if (req.route.path === '/users/login') {
    const payload = { id_users: profile.id_users };
    profile.token = jwt.sign(payload, jwtOptions.secretOrKey);
  }
  profile.tgl_create_users = moment(profile.tgl_create_users).unix();
  profile.tglstatus_users = moment(profile.tglstatus_users).unix();
  delete profile.password_users;
  req.resData = {
    status: true,
    message: 'User Data',
    data: profile,
  };
  return next();
};
