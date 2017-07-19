import _ from 'lodash';
import logger from 'morgan';
import passport from 'passport';
import validate from 'validate.js';
import c from '../../constants';
import config from '../../../config';
import { AuthorizationError, BadRequestError } from '../../../common/errors';

/**
 * Request logger middleware
 * @param {Array} env
 * @return {function}
 */
export function requestLoggerMiddleware(env) {
  env = (env === undefined) ? [c.DEVELOPMENT, c.STAGING, c.PRODUCTION] : env;
  env = Array.isArray(env) ? env : [env];
  return _.includes(env, config.env) ? logger(config.logFormat) : (req, res, next) => next();
}

/**
 * Add some utilities to request object
 * @return {function}
 */
export function requestUtilsMiddleware() {
  return (req, res, next) => {
    req.messages = {
      errors: [],
      warnings: [],
      validation: {},
    };
    next();
  };
}

export function apiResponse() {
  return (req, res) => {
    const code = res.statusCode;
    const { status = true, message = 'Success', data = {}, meta } = req.resData || {};
    return res.json({
      code,
      status,
      message,
      meta,
      data,
    });
  };
}

export function auth(authorization = true) {
  return (req, res, next) => {
    passport.authenticate('jwt', (err, user) => {
      if (!user && authorization) {
        err = new AuthorizationError('unauthorized');
        return next(err);
      }
      req.user = user;
      return next();
    })(req, res, next);
  };
}

export function checkContentType() {
  return (req, res, next) => {
    if (req.method === 'GET') return next();
    const contentType = req.headers['content-type'];
    if (!contentType || contentType.indexOf('application/json') !== 0) {
      return next(new BadRequestError('Invalid format'));
    }
    return next();
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
export function formatValidation(rules, msg) {
  return (req, res, next) => {
    const hasError = validate(req.body, rules);
    return next(formatError(msg, hasError));
  };
}

/**
 * Validate parameters
 * @param constraints {object}
 * @param isBody {boolean} true evaluate req.body else req.query
 * @param prop {object} name of the array to check
 * @param strict {boolean} need to be available
 * @param msg {object} title for error
 */
export function validateParam(
  constraints,
  isBody = false,
  prop = null,
  strict = false,
  msg = null,
) {
  return (req, res, next) => {
    if (Array.isArray(req.body[prop])) {
      const params = req.body[prop];
      // Can the param be empty array or not
      const evaluate = strict ? true : params.length > 0;
      if (evaluate) {
        params.forEach((param) => {
          const hasError = validate(param, constraints);
          return hasError ? next(formatError(msg, hasError)) : undefined;
        });
      }
    } else {
      const hasError = validate(isBody ? req.body : req.query, constraints);
      if (hasError) {
        const err = new BadRequestError('Invalid parameter');
        err.data = hasError;
        return next(err);
      }
    }
    return next();
  };
}
