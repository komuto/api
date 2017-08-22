import express from 'express';
import { ReviewController } from './controller';
import { utils, middleware } from '../core';
import constraints from './validation';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth, validateParam } = middleware;

/**
 * GET /reviews/search
 * Get list of reviews
 */
routes.get('/reviews/search',
  wrap(ReviewController.getReviews),
  apiResponse());

/**
 * GET /products/id/reviews
 * Get all reviews of a product
 */
routes.get('/products/:id([0-9]{1,10})/reviews',
  wrap(ReviewController.getReviews),
  apiResponse());

/**
 * POST /products/id/reviews
 * Create a product review
 */
routes.post('/products/:id([0-9]{1,10})/reviews',
  auth(),
  validateParam(constraints.createReview, true),
  wrap(ReviewController.createReview),
  apiResponse());

export default routes;
