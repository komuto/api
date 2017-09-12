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

routes.get('/saldo/nominal/:id/token',
  auth(),
  wrap(PaymentController.getSaldoSnapToken),
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

/**
 * POST bulk review
 */
routes.post('/transactions/:id([0-9]{1,10})/invoices/:invoice_id([0-9]{1,10})',
  auth(),
  validateParam(constraints.bulkReview, true, null, true,
    params => ({ ...params, product_id: String(params.product_id) })),
  wrap(PaymentController.bulkReview),
  apiResponse());

/**
 * POST complaint products
 */
routes.post('/transactions/:id([0-9]{1,10})/invoices/:invoice_id([0-9]{1,10})/dispute',
  auth(),
  // TODO: Add validation products & problems
  validateParam(constraints.dispute, true),
  validateParam(constraints.images, true, 'images', true),
  wrap(PaymentController.dispute),
  apiResponse());

/**
 * GET list dispute buyer
 */
routes.get('/users/disputes',
  auth(),
  validateParam(constraints.listDispute),
  wrap(PaymentController.getDisputes),
  apiResponse());

/**
 * GET detail dispute buyer
 */
routes.get('/users/disputes/:id([0-9]{1,10})',
  auth(),
  wrap(PaymentController.getDispute),
  apiResponse());

/**
 * GET list dispute seller
 */
routes.get('/users/store/disputes',
  auth(),
  validateParam(constraints.listDispute),
  wrap(PaymentController.getStoreDisputes),
  apiResponse());

/**
 * GET detail dispute seller
 */
routes.get('/users/store/disputes/:id([0-9]{1,10})',
  auth(),
  wrap(PaymentController.getStoreDispute),
  apiResponse());

export default routes;
