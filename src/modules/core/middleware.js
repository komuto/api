import _ from 'lodash';
import moment from 'moment';
import ch from 'chalk';
import morgan from 'morgan';
import winston from 'winston';
import 'winston-daily-rotate-file';
import 'winston-loggly-bulk';
import passport from 'passport';
import validate from 'validate.js';
import c from '../../constants';
import config from '../../../config';
import { AuthorizationError, BadRequestError } from '../../../common/errors';
import messages from '../core/messages';

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
    const { status = true, message = messages.success.msg, data = {}, meta } = req.resData || {};
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
      if (!user && authorization) return next(new AuthorizationError(messages.unauthorized.msg));
      if (authorization && user.marketplace_id !== req.marketplace.id) {
        throw new AuthorizationError(messages.unauthorized.msg);
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
      return next(new BadRequestError(messages.bad_request.format));
    }
    return next();
  };
}

export function pathNotFound() {
  return (req, res, next) => {
    const err = new Error(messages.path_not_found.msg);
    err.httpStatus = messages.path_not_found.code;
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
      response.code = messages.something_wrong.code;
      response.message = messages.something_wrong.msg;
      response.data = {};
    }
    res.status(statusCode).json(response);
  };
}

export function winstonLogger() {
  winston.add(winston.transports.Loggly, {
    token: config.loggly.token,
    subdomain: config.loggly.subdomain,
    tags: ['Komuto-API'],
    json: true,
  });
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
      // logger.info(message);
      winston.log('info', message);
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
export function formatError(msg, err) {
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
 * When prop is present isBody checks whether the array should contain object or not
 * true must the array values are objects, false primitives
 * @param prop {string} name of the array to check
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
      if (params && params.length === 0 && !strict) return next();
      // Can the param be empty array or not
      const evaluate = strict ? true : params && params.length > 0;
      if (evaluate) {
        if (params.length === 0) {
          const hasError = validate({}, constraints);
          throw new BadRequestError(messages.bad_request.parameter, hasError);
        }
        const propName = Object.keys(constraints)[0];
        params.forEach((param) => {
          if (modify) param = modify(param);
          if (!isBody) param = { [propName]: param };
          const hasError = validate(param, constraints);
          if (hasError) throw new BadRequestError(`${messages.bad_request.parameter} ${prop || ''}`, hasError);
        });
      }
    } else {
      const hasError = validate(isBody ? req.body : req.query, constraints);
      if (hasError) {
        return next(new BadRequestError(messages.bad_request.parameter, hasError));
      }
    }
    return next();
  };
}

export function validateImageUrl(str, msg) {
  if (str) {
    const re = new RegExp('^(http|https|file)://', 'i');
    const notValid = re.test(str);
    if (notValid) throw new BadRequestError(msg);
  }
}
