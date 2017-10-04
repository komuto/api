import express from 'express';
import { BucketController } from './controller';
import { utils, middleware } from '../core';
import constraints from './validation';
import { validateCart } from './middleware';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth, validateParam } = middleware;

/**
 * GET /buckets/count
 * Get bucket count
 */
routes.get('/buckets/count',
  auth(),
  wrap(BucketController.getCount),
  apiResponse());

/**
 * Add promo
 */
routes.post('/buckets/promo',
  auth(),
  validateParam(constraints.promo, true),
  wrap(BucketController.addPromo),
  apiResponse());

/**
 * Cancel promo
 */
routes.delete('/buckets/promo/cancel',
  auth(),
  wrap(BucketController.cancelPromo),
  apiResponse());

/**
 * GET /users/bucket
 * Get bucket
 */
routes.get('/users/bucket',
  auth(),
  wrap(BucketController.getBucket),
  apiResponse());

/**
 * POST /buckets
 * Add to cart
 */
routes.post('/buckets',
  auth(),
  validateCart(),
  validateParam(constraints.cart, true),
  wrap(BucketController.addToCart),
  apiResponse());

/**
 * DELETE /buckets/items/id
 * Delete cart
 */
routes.delete('/buckets/items/:id([0-9]{1,10})',
  auth(),
  wrap(BucketController.deleteCart),
  apiResponse());

/**
 * GET /users/bucket/items/id
 * Get detail item
 */
routes.get('/users/bucket/items/:id([0-9]{1,10})',
  auth(),
  wrap(BucketController.getItem),
  apiResponse());

/**
 * Checkout
 */
routes.post('/checkout',
  auth(),
  wrap(BucketController.checkout),
  apiResponse());

/**
 * Bulk update cart
 */
routes.put('/buckets',
  auth(),
  validateParam(constraints.bulkUpdate, true, 'items', false),
  wrap(BucketController.bulkUpdate),
  apiResponse());

routes.put('/transactions/:id([0-9]{1,10})/balance-payment',
  auth(),
  wrap(BucketController.balancePayment),
  apiResponse());

export default routes;
