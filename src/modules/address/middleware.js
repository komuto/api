import constraints from './validation';
import { msg } from './messages';
import { middleware } from '../core';

const { createMsg, updateMsg } = msg;
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
