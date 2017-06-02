import jwt from 'jsonwebtoken';
import {User} from './model';
import {jwt as jwtOptions} from '../../../config';

export const UserController = {};
export default {UserController};

/**
 * View user profile
 */
UserController.getUser = async(req, res, next) => {
  let profile = req.user;
  if (req.params.id) {
    profile = await User.getById(req.params.id);
  }

  if (!profile) {
    const err = new Error('Invalid user');
    return next(err);
  }
  if (req.route.path === '/user/login') {
    const payload = {user_id: profile.user_id};
    profile.token = jwt.sign(payload, jwtOptions.secretOrKey);
  }
  delete profile.password_users;
  req.resData = {
    status: true,
    message: 'User Data',
    data: profile,
  };
  return next();
};
