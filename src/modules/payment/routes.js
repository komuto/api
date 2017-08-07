import express from 'express';
import { PaymentController } from './controller';
import core from '../core';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;

routes.post('/payments',
  wrap(PaymentController.store),
  apiResponse());

/**
 * POST /payment
 * Choose payment methods
 */
routes.post('/payment',
  auth(),
  validateParam(constraints.choose_payment, true),
  wrap(PaymentController.choosePaymentMethod),
  apiResponse());

/**
 * POST /buckets/id/bank
 * Bank payment method
 */
routes.post('/buckets/:id([0-9]{1,10})/bank',
  auth(),
  validateParam(constraints.bank, true),
  wrap(PaymentController.viaBank),
  apiResponse());

/**
 * GET /payment-methods
 * Get payment methods
 */
routes.get('/payment-methods',
  wrap(PaymentController.getMethods),
  apiResponse());

export default routes;
