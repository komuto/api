import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import { validateParam } from './middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth } = core.middleware;
const cache = core.cache;

/**
 * GET /products
 * View list of products
 */
routes.get('/products',
  cache('5 minutes'),
  validateParam(constraints.list),
  wrap(ProductController.index),
  apiResponse());

/**
 * GET /products/search
 * View list of search result
 */
routes.get('/products/search',
  validateParam(constraints.search),
  wrap(ProductController.search),
  apiResponse());

/**
 * POST /products/id/reviews
 * Create a product review
 */
routes.post('/products/:id/reviews',
  auth(),
  wrap(ProductController.createReview),
  apiResponse());

/**
 * Get /products/id/reviews
 */
routes.get('/products/:id/reviews',
  wrap(ProductController.getReviews),
  apiResponse());

export default routes;
