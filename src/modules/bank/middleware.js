import constraints from './validation';
import { msg } from './messages';
import { middleware } from '../core';

const { createMsg, deleteMsg } = msg;
const { formatValidation } = middleware;

export function validateCreateBankAccount() {
  return formatValidation(constraints.createUpdate, createMsg.title);
}

export function validateDeleteBankAccount() {
  return formatValidation(constraints.delete, deleteMsg.title);
}
