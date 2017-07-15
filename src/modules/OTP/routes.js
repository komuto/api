import express from 'express';
import { OTPController } from './controller';
import core from '../core';
import { OTPMsg } from './message';

const routes = express.Router();
const { apiResponse, auth } = core.middleware;
const { wrap } = core.utils;

/**
 * Send phone verification code
 */
routes.post('/users/otp',
  auth(),
  wrap(OTPController.createOTPHP),
  wrap(OTPController.sendSms),
  apiResponse());

export default routes;
