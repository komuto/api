import express from 'express';
import { OTPController } from './controller';
import core from '../core';

const routes = express.Router();
const { apiResponse, auth } = core.middleware;
const { wrap } = core.utils;

/**
 * Send phone verification code
 */
routes.post('/accounts/otp/phone',
  auth(),
  wrap(OTPController.createOTPHP),
  wrap(OTPController.sendSms),
  apiResponse());

/**
 * Send bank verification code
 */
routes.post('/accounts/otp/bank',
  auth(),
  wrap(OTPController.createOTPBank),
  wrap(OTPController.sendEmail),
  apiResponse());

export default routes;
