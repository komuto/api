import constraints from './validation';
import { errMsg } from './error';
import { middleware } from '../core';

const { createMsg, deleteMsg } = errMsg;
const { formatValidation } = middleware;

export function validateCreateBankAccount() {
  return formatValidation(constraints.createUpdate, createMsg.title);
}

export function validateDeleteBankAccount() {
  return formatValidation(constraints.delete, deleteMsg.title);
}
