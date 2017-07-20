import constraints from './validation';
import { errMsg } from './messages';
import { middleware } from '../core';

const { createMsg, updateMsg } = errMsg;
const { formatValidation } = middleware;

/**
 * Create Address validation middleware
 */
export function validateCreate() {
  return formatValidation(constraints.createAddress, createMsg.title);
}

export function validateUpdate() {
  return formatValidation(constraints.updateAddress, updateMsg.title);
}
