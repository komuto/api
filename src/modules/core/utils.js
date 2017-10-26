import _ from 'lodash';
import moment from 'moment';
import cfg from '../../../config';
import { BadRequestError } from '../../../common/errors';

/**
 * Wrap controller function
 * @param {function} fn
 */
export function wrap(fn) {
  return (...args) => {
    try {
      const result = fn(...args);
      if (result && _.isFunction(result.catch)) {
        result.catch(args[2]);
      }

      return result;
    } catch (e) {
      return args[2](e);
    }
  };
}

/**
 * Wrapper function for config
 * @param {string} key
 * @param {*} defaultValue
 */
export function config(key, defaultValue) {
  if (cfg[key] === undefined) {
    return defaultValue;
  }

  return cfg[key];
}

/**
 * Wrapper function for default value
 * @param {*} key
 * @param {*} defaultValue
 * @param {*} transform
 */
export function checkNull(key, defaultValue, transform = null) {
  if (key === undefined || key === null) return defaultValue;
  if (transform !== null) return transform;
  return key;
}

export function parseDate(key, defaultValue) {
  return checkNull(key, defaultValue, moment(key).unix());
}

export function parseNum(key, defaultValue) {
  if (!key) return defaultValue !== undefined ? defaultValue : 0;
  return checkNull(key, defaultValue, parseInt(key, 10));
}

export function parseDec(key, defaultValue) {
  return checkNull(key, defaultValue, parseFloat(key));
}

export function defaultNull(key) {
  return checkNull(key, null);
}

export function defaultUndenfined(key) {
  return checkNull(key, undefined);
}

/**
 * Format error other than validate.js, for consistent error response.
 * Singular because once the error encountered the api will throw the error,
 * thus not allowing it to have multiple error messages
 * @param obj {string} the object property of the message
 * @param message {string}
 */
export function formatSingularErr(obj, message) {
  return { [obj]: [message] };
}

/**
 * Format bad request error
 * @param field {string} field that causes error
 * @param msg {string} message of the error
 */
export function formatError(field, msg) {
  const data = formatSingularErr(field, this[msg]);
  return new BadRequestError(this[msg], data);
}

/**
 * Transform supplied data properties to match with db column
 * @param input {object}
 * @param columnName {object}
 * @returns {object}
 */
export function matchDB(input, columnName) {
  return Object.keys(input).reduce((matched, prop) => {
    if (columnName[prop] && input[prop] !== undefined) matched[columnName[prop]] = input[prop];
    return matched;
  }, {});
}

export function getName(str) {
  const name = str.split(' ');
  const firstName = name.splice(0, 1)[0];
  const lastName = name.length ? name.join(' ') : firstName;
  return { firstName, lastName };
}

export function getProductAndStore(val) {
  const arr = String(val).split('.');
  return {
    productId: parseNum(arr[0]),
    storeId: parseNum(arr[1]),
  };
}

// Create getter object so that knex object could be serialized using Product model
export const getter = {
  get(prop) { return this[prop]; },
};
