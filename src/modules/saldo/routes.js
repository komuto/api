import express from 'express';
import { SaldoController } from './controller';
import core from '../core';
import constraints from './validation';
import { OTPController } from '../OTP/controller';
import { withdrawError } from './messages';

const routes = express.Router();
const { apiResponse, auth, validateParam } = core.middleware;
const { wrap } = core.utils;

/**
 * Withdraw wallet
 */
routes.post('/users/saldo/withdraw',
  auth(),
  validateParam(constraints.withdraw, true),
  wrap(OTPController.verifyOTPBankCode(withdrawError('otp_code', 'otp_not_found'))),
  wrap(SaldoController.withdrawWallet),
  apiResponse());

/**
 * History saldo
 */
routes.get('/users/saldo/history',
  auth(),
  wrap(SaldoController.history),
  apiResponse());

export default routes;
