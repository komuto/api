import express from 'express';
import { BucketController } from './controller';
import { utils, middleware } from '../core';

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

export default routes;
