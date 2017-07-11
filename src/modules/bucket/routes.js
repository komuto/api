import express from 'express';
import { BucketController } from './controller';
import { utils, middleware } from '../core';
import { validateParam } from './middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

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

export default routes;
