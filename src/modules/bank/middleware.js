import constraints from './validation';
import utils from '../../../common/utils';
import { BadRequestError } from '../../../common/errors';
import { createMsg, deleteMsg } from './message';
import { middleware } from '../core';

const { formatValidation } = middleware;

export function validateCreateBankAccount() {
  return formatValidation(constraints.create, createMsg.title);
}

export function validateDeleteBankAccount() {
  return formatValidation(constraints.delete, deleteMsg.title);
}
