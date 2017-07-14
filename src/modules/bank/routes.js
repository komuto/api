import express from 'express';
import { BankController } from './controller';
import core from '../core';
import { controller } from '../user';
import { createMsg } from './message';
import { validateCreateBankAccount } from './middleware';

const routes = express.Router();
const { wrap } = core.utils;
const { UserController } = controller;
const { apiResponse, auth } = core.middleware;

/**
 * GET /banks
 * View list of banks
 */
routes.get('/banks',
  wrap(BankController.getAll),
  apiResponse());

/**
 * GET /banks/:id
 * View bank detail
 */
routes.get('/banks/:id',
  wrap(BankController.getBank),
  apiResponse());

/**
 * GET /accounts/banks
 * View list of bank account
 */
routes.get('/accounts/banks',
  auth(),
  wrap(BankController.getBankAccounts),
  apiResponse());

routes.post('/accounts/banks',
  auth(),
  validateCreateBankAccount(),
  wrap(UserController.verifyOTPCode(createMsg.title)),
  wrap(BankController.createBankAccount),
  apiResponse());

export default routes;
