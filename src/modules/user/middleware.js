import _ from 'lodash';
import jwt from 'jsonwebtoken';
import constraints from './validation';
import utils from '../../../common/utils';
import { BadRequestError } from '../../../common/errors';
import { jwt as jwtOptions } from '../../../config';
import { loginMsg, registrationMsg, updateMsg, userMsg } from './message';
import { middleware } from '../core';

export const ROLE_ALL = '*';
const { formatValidation } = middleware;

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

export function validateLogin() {
  return formatValidation(constraints.login, loginMsg.title);
}

export function validateSocialLogin() {
  return formatValidation(constraints.socialLogin, loginMsg.title);
}

export function validateRegistration() {
  return formatValidation(constraints.registration, registrationMsg.title);
}

export function validateUpdate() {
  return formatValidation(constraints.update, updateMsg.title);
}

export function validateUpdatePhone() {
  return formatValidation(constraints.updatePhone, updateMsg.title);
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
    return next(new BadRequestError(userMsg.not_found));
  }

  req.resData = {
    message: 'User Data',
    data: req.user,
  };
  return next();
}
