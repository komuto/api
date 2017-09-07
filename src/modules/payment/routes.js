import express from 'express';
import { PaymentController } from './controller';
import core from '../core';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;

routes.get('/payments',
  auth(),
  wrap(PaymentController.getSnapToken),
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

/**
 * GET list transactions
 */
routes.get('/transactions',
  auth(),
  wrap(PaymentController.listTransactions),
  apiResponse());

/**
 * GET detail transactions
 */
routes.get('/transactions/:id([0-9]{1,10})',
  auth(),
  wrap(PaymentController.detailTransaction),
  apiResponse());

/**
 * GET detail invoice
 */
routes.get('/transactions/:id([0-9]{1,10})/invoices/:invoice_id([0-9]{1,10})',
  auth(),
  wrap(PaymentController.detailInvoice),
  apiResponse());

export default routes;
