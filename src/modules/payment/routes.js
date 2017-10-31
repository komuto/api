import express from 'express';
import { PaymentController } from './controller';
import core from '../core';
import constraints from './validation';
import storeConstraints from './../store/validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;

routes.get('/transactions/:id([0-9]{1,10})/token',
  auth(),
  validateParam(constraints.getToken),
  wrap(PaymentController.getSnapToken),
  apiResponse());

routes.get('/saldo/nominal/:id/token',
  auth(),
  validateParam(constraints.getToken),
  wrap(PaymentController.getSaldoSnapToken),
  apiResponse());

/**
 * POST /buckets/id/bank
 * Bank payment method
 */
// unused route
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
  validateParam(constraints.products, false, 'products', true,
    param => String(param)),
  validateParam(constraints.problems, false, 'problems', true),
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
 * POST create/reply user dispute discussions
 */
routes.post('/users/disputes/:id([0-9]{1,10})/discussions',
  auth(),
  validateParam(storeConstraints.reply_message, true),
  wrap(PaymentController.createDisputeDiscussion),
  apiResponse());

/**
 * POST buyer - product has been received
 */
routes.post('/users/disputes/:id([0-9]{1,10})/received',
  auth(),
  validateParam(constraints.disputeBulkReview, true, null, true),
  wrap(PaymentController.confirmDispute),
  apiResponse());

/**
 * POST buyer refund
 */
routes.post('/users/disputes/:id([0-9]{1,10})/refund',
  auth(),
  wrap(PaymentController.buyerRefund),
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

/**
 * POST create/reply store dispute discussions
 */
routes.post('/users/store/disputes/:id([0-9]{1,10})/discussions',
  auth(),
  validateParam(storeConstraints.reply_message, true),
  wrap(PaymentController.createStoreDisputeDiscussion),
  apiResponse());

/**
 * PUT update airway bill
 */
routes.put('/users/store/disputes/:id([0-9]{1,10})/airway-bill',
  auth(),
  validateParam(constraints.airwayBill, true),
  wrap(PaymentController.updateAirwayBill),
  apiResponse());

/**
 * PUT seller - product has been received
 */
routes.put('/users/store/disputes/:id([0-9]{1,10})/received',
  auth(),
  wrap(PaymentController.confirmStoreDispute),
  apiResponse());

/**
 * GET new orders
 */
routes.get('/new-orders',
  auth(),
  wrap(PaymentController.getNewOrders),
  apiResponse());

/**
 * GET order detail
 */
routes.get('/invoices/:id([0-9]{1,10})/new-order-detail',
  auth(),
  wrap(PaymentController.getNewOrderDetail),
  apiResponse());

/**
 * GET processing orders
 */
routes.get('/processing-orders',
  auth(),
  wrap(PaymentController.getProcessingOrders),
  apiResponse());

/**
 * GET processing order detail
 */
routes.get('/invoices/:id([0-9]{1,10})/processing-order-detail',
  auth(),
  wrap(PaymentController.getProcessingOrderDetail),
  apiResponse());

/**
 * GET sales
 */
routes.get('/sales',
  auth(),
  validateParam(constraints.sales),
  wrap(PaymentController.getSales),
  apiResponse());

/**
 * GET sale detail
 */
routes.get('/invoices/:id([0-9]{1,10})/sale-detail',
  auth(),
  wrap(PaymentController.getSaleDetail),
  apiResponse());

/**
 * PUT accept order
 */
routes.put('/invoices/:id([0-9]{1,10})/accept',
  auth(),
  wrap(PaymentController.acceptOrder),
  apiResponse());

/**
 * PUT reject order
 */
routes.put('/invoices/:id([0-9]{1,10})/reject',
  auth(),
  wrap(PaymentController.rejectOrder),
  apiResponse());

/**
 * PUT input airway bill
 */
routes.put('/invoices/:id([0-9]{1,10})/airway-bill',
  auth(),
  validateParam(constraints.airwayBill, true),
  wrap(PaymentController.inputAirwayBill),
  apiResponse());

export default routes;
