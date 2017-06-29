const status = require('http-status');

class RuntimeError extends Error {}
class ServiceNotFoundError extends RuntimeError {}
class ConfigurationError extends RuntimeError {}

class APIError extends Error {
  constructor(msg, data, previousError, httpStatus) {
    if (msg instanceof Error) {
      previousError = msg;
      msg = previousError.message;
    }

    super(msg);
    this.httpStatus = httpStatus || status.INTERNAL_SERVER_ERROR;
    this.data = data;
    this.previousError = previousError;
  }
}

class AuthorizationError extends APIError {
  constructor(msg, data, previousError) {
    super(msg, data, previousError, status.UNAUTHORIZED);
  }
}

class AuthenticationError extends APIError {
  constructor(msg, data, previousError) {
    super(msg, data, previousError, status.FORBIDDEN);
  }
}

class BadRequestError extends APIError {
  constructor(msg, data, previousError) {
    super(msg, data, previousError, status.BAD_REQUEST);
  }
}

class InternalServerError extends APIError {
  constructor(msg, data, previousError) {
    super(msg, data, previousError, status.INTERNAL_SERVER_ERROR);
  }
}

class NotFoundError extends APIError {
  constructor(msg, data, previousError) {
    super(msg, data, previousError, status.NOT_FOUND);
  }
}

module.exports = {
  RuntimeError,
  ServiceNotFoundError,
  ConfigurationError,
  APIError,
  AuthorizationError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
};
