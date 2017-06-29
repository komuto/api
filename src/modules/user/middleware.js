import _ from 'lodash';
import validate from 'validate.js';
import jwt from 'jsonwebtoken';
import constraints from './validation';
import utils from '../../../common/utils';
import { BadRequestError } from '../../../common/errors';
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
 * Format the error response
 * @param err {object} Error object
 * @param msg {string} Error title
 */
function formatError(msg, err) {
  if (err) return new BadRequestError(msg, err);
  return undefined;
}

/**
 * Create the validation middleware
 * @param rules {object} constraints
 * @param msg {string} Error title
 */
function formatValidation(rules, msg) {
  return (req, res, next) => {
    const hasError = validate(req.body, rules);
    return next(formatError(msg, hasError));
  };
}

/**
 * Login form validation middleware
 * @param
 */
export function validateLogin() {
  return formatValidation(constraints.login, 'Login failed');
}

export function validateSocialLogin() {
  return formatValidation(constraints.socialLogin, 'Login failed');
}

export function validateRegistration() {
  return formatValidation(constraints.registration, 'Registration failed');
}

export function validateUpdate() {
  return formatValidation(constraints.update, 'User update failed');
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
    return next(new BadRequestError('Invalid user'));
  }

  req.resData = {
    message: 'User Data',
    data: req.user,
  };
  return next();
}
