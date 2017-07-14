import express from 'express';
import { BankController } from './controller';
import core from '../core';
import { controller } from '../user';
import { createMsg, updateMsg } from './message';
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

/**
 * Get bank account
 */
routes.get('/accounts/banks/:id',
  auth(),
  wrap(BankController.getBankAccount),
  apiResponse());

/**
 * Create bank account
 */
routes.post('/accounts/banks',
  auth(),
  validateCreateBankAccount(),
  wrap(UserController.verifyOTPCode(createMsg.title)),
  wrap(BankController.createBankAccount),
  apiResponse());

/**
 * Update bank account
 */
routes.put('/accounts/banks/:id',
  auth(),
  validateCreateBankAccount(),
  wrap(UserController.verifyOTPCode(updateMsg.title)),
  wrap(BankController.updateBankAccount),
  apiResponse());

export default routes;
