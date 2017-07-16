import express from 'express';
import { BankController } from './controller';
import core from '../core';
import { controller } from '../OTP';
import { createAccountError, updateAccountError, deleteAccountError } from './error';
import { validateCreateBankAccount, validateDeleteBankAccount } from './middleware';

const routes = express.Router();
const { wrap } = core.utils;
const { OTPController } = controller;
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
  wrap(OTPController.verifyOTPBankCode(createAccountError('code', 'code_not_found'))),
  wrap(BankController.createBankAccount),
  apiResponse());

/**
 * Update bank account
 */
routes.put('/accounts/banks/:id',
  auth(),
  validateCreateBankAccount(),
  wrap(OTPController.verifyOTPBankCode(updateAccountError('code', 'code_not_found'))),
  wrap(BankController.updateBankAccount),
  apiResponse());

/**
 * Delete bank account
 */
routes.delete('/accounts/banks/:id',
  auth(),
  validateDeleteBankAccount(),
  wrap(OTPController.verifyOTPBankCode(deleteAccountError('code', 'code_not_found'))),
  wrap(BankController.deleteBankAccount),
  apiResponse());

export default routes;
