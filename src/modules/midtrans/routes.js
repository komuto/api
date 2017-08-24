import express from 'express';
import { PaymentController } from '../payment/controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;

/**
 * POST /notification
 * Handling notification
 */
routes.get('/notification',
  wrap(PaymentController.notification),
  apiResponse());

export default routes;
