import constraints from './validation';
import { createMsg, updateMsg } from './message';
import { middleware } from '../core';

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
