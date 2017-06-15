import _ from 'lodash';
import validate from 'validate.js';
import jwt from 'jsonwebtoken';
import constraints from './validation';
import utils from '../../../common/utils';
import { jwt as jwtOptions } from '../../../config';

export const ROLE_ALL = '*';

/**
 * Auth middleware
 * @param {array} roles
 * @param {string|function} failedCb
 */
export function auth(roles, failedCb) {
  const reject = (req, res, next) => {
    if (utils.isFunction(failedCb)) return failedCb(req, res);
    const err = new Error('Access denied.');
    return next(err);
  };

  return (req, res, next) => {
    if (req.isAuthenticated()) {
      if (!roles || roles === ROLE_ALL) return next();

      roles = utils.isArray(roles) ? roles : [roles];
      const user = req.user || {};
      // fix role
      if (_.includes(roles, user.role)) return next();
    }

    return reject(req, res);
  };
}

/**
 * Login form validation middleware
 */
export function validateLogin({ social = false } = {}) {
  return (req, res, next) => {
    const hasError = validate(req.body, !social ? constraints.login : constraints.socialLogin);
    if (hasError) {
      return next(hasError);
    }
    return next();
  };
}

/**
 * Add token to user
 */
export function addToken(req, res, next) {
  const payload = { id_users: req.user.id };
  req.user.token = jwt.sign(payload, jwtOptions.secretOrKey);
  return next();
}

/**
 * Build user data response
 */
export function userData(req, res, next) {
  if (!req.user) {
    const err = new Error('Invalid user');
    return next(err);
  }

  req.resData = {
    status: true,
    message: 'User Data',
    data: req.user,
  };
  return next();
}
