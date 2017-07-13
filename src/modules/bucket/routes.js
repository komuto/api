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
 * GET /promo
 * Get promo
 */
routes.get('/promo',
  auth(),
  validateParam(constraints.promo),
  wrap(BucketController.getPromo),
  apiResponse());

/**
 * Get bucket
 */
routes.get('/users/bucket',
  auth(),
  wrap(BucketController.getBucket),
  apiResponse());

/**
 * Add to cart
 */
routes.post('/buckets',
  auth(),
  validateParam(constraints.cart, true),
  wrap(BucketController.addToCart),
  apiResponse());

export default routes;
