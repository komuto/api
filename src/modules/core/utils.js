import _ from 'lodash';
import cfg from '../../../config';

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
export function input(key, defaultValue, transform = null) {
  if (key === undefined) return defaultValue;
  if (transform) return transform;
  return key;
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
