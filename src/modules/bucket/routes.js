import express from 'express';
import { BucketController } from './controller';
import { utils, middleware } from '../core';
import constraints from './validation';

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
 * GET /buckets/promo
 * Get promo
 */
routes.get('/buckets/promo',
  auth(),
  validateParam(constraints.promo),
  wrap(BucketController.getPromo),
  apiResponse());

/**
 * GET /buckets/promo/cancel
 * Cancel promo
 */
routes.get('/buckets/promo/cancel',
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
  validateParam(constraints.checkout, true),
  wrap(BucketController.checkout),
  apiResponse());

export default routes;
