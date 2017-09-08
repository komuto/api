import express from 'express';
import { ReviewController } from './controller';
import { utils, middleware } from '../core';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

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
 * GET /users/reviews
 * Get all reviews of user
 */
routes.get('/users/reviews',
  auth(),
  wrap(ReviewController.getUserReviews),
  apiResponse());

/**
 * GET /users/store/reviews
 * Get all reviews of store
 */
routes.get('/users/store/reviews',
  auth(),
  wrap(ReviewController.getStoreReviews),
  apiResponse());

export default routes;
