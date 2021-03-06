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
 * Get topup status
 */
routes.get('/users/saldo/topup',
  auth(),
  wrap(SaldoController.getTopupStatus),
  apiResponse());

/**
 * Get withdraw status
 */
routes.get('/users/saldo/withdraw',
  auth(),
  wrap(SaldoController.getWithdrawStatus),
  apiResponse());

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
  validateParam(constraints.history),
  wrap(SaldoController.history),
  apiResponse());

/**
 * History saldo detail
 */
routes.get('/users/saldo/history/:id([0-9]{1,10})/',
  auth(),
  wrap(SaldoController.historyDetail),
  wrap(SaldoController.paymentTrans),
  wrap(SaldoController.sellingTrans),
  wrap(SaldoController.topupTrans),
  wrap(SaldoController.withdrawTrans),
  wrap(SaldoController.refundTrans),
  SaldoController.endTrans,
  apiResponse());

/**
 * List nominal
 */
routes.get('/saldo/nominal',
  auth(),
  wrap(SaldoController.nominal),
  apiResponse());

export default routes;
