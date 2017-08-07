import express from 'express';
import { PaymentController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth } = core.middleware;

routes.post('/payments',
  wrap(PaymentController.store),
  apiResponse());

/**
 * GET /payment-methods
 * Get payment methods
 */
routes.get('/payment-methods',
  wrap(PaymentController.getMethods),
  apiResponse());

routes.get('/transactions',
  auth(),
  wrap(PaymentController.listTransactions),
  apiResponse());

export default routes;
