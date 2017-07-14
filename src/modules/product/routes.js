import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import constraints from './validation';
import { ReviewController } from '../review';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;
const { cache } = core;

/**
 * GET /products
 * View list of products
 */
routes.get('/products',
  auth(false),
  // cache('5 minutes'),
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
  wrap(ReviewController.createReview),
  apiResponse());

/**
 * GET /products/id
 * Get full detailed product
 */
routes.get('/products/:id',
  auth(false),
  wrap(ProductController.getProduct),
  apiResponse());

/**
 * GET /products/id/reviews
 * Get all reviews of a product
 */
routes.get('/products/:id/reviews',
  wrap(ReviewController.getReviews),
  apiResponse());

/**
 * GET /products/id/wishlist
 * Add to wishlist
 */
routes.get('/products/:id/wishlist',
  auth(),
  wrap(ProductController.addWishlist),
  apiResponse());

/**
 * GET /products/id/discussions
 * Get all discussions of a product
 */
routes.get('/products/:id/discussions',
  wrap(ProductController.getDiscussions),
  apiResponse());

export default routes;
