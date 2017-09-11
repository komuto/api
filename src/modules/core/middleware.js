import _ from 'lodash';
import moment from 'moment';
import ch from 'chalk';
import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
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
  return _.includes(env, config.env) ? morgan(config.logFormat) : (req, res, next) => next();
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
      if (!user && authorization) return next(new AuthorizationError('unauthorized'));
      if (authorization && user.marketplace_id !== req.marketplace.id) throw new AuthorizationError('unauthorized');
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

export function pathNotFound() {
  return (req, res, next) => {
    const err = new Error('Path Not Found');
    err.httpStatus = 404;
    next(err);
  };
}

export function errResponse() { // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const statusCode = err.httpStatus || 406;
    const response = {
      status: false,
      code: err.httpStatus || 406,
      message: err.message,
      data: err.data || {},
    };
    if (config.env !== 'development') {
      response.code = 400;
      response.message = 'Something went wrong';
      response.data = {};
    }
    res.status(statusCode).json(response);
  };
}

export function winstonLogger() {
  const logger = new (winston.Logger)({
    transports: [
      new winston.transports.DailyRotateFile({
        filename: config.logPath,
        datePattern: 'yyyy-MM-dd.',
        prepend: true,
        level: 'debug',
        timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss'),
        json: false,
      }),
    ],
  });

  logger.stream = {
    write: (message) => {
      logger.info(message);
    },
  };

  morgan.token('body', req => `\n${JSON.stringify(req.body, null, 2)}`);
  return morgan(`${ch.red(':method')} ${ch.green(':url')} ${ch.yellow(':response-time ms')} :body`, { stream: logger.stream });
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
 * @param modify {function} modify params before validated
 * e.g. usage for parsing int to string to validate with regex(format in validatejs)
 */
export function validateParam(
  constraints,
  isBody = false,
  prop = undefined,
  strict = false,
  modify = false,
) {
  return (req, res, next) => {
    if (prop !== undefined) {
      const params = prop ? req.body[prop] : req.body;
      // Can the param be empty array or not
      const evaluate = strict ? true : params && params.length > 0;
      if (evaluate) {
        if (!Object.keys(params).length) {
          throw new BadRequestError('Invalid parameter');
        }
        params.forEach((param) => {
          if (modify) param = modify(param);
          const hasError = validate(param, constraints);
          if (hasError) throw formatError(`Invalid parameter ${prop || ''}`, hasError);
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
