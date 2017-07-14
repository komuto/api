import constraints from './validation';
import utils from '../../../common/utils';
import { BadRequestError } from '../../../common/errors';
import { createMsg } from './message';
import { middleware } from '../core';

const { formatValidation } = middleware;

export function validateCreateBankAccount() {
  return formatValidation(constraints.create, createMsg.title);
}
