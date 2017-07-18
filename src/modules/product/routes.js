import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import constraints from './validation';
import { errMsg } from './error';
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
 * Create product
 */
routes.post('/products',
  auth(),
  validateParam(constraints.createProduct, true),
  validateParam(constraints.createWholesale, false, 'wholesales', false, errMsg.createProduct),
  validateParam(constraints.createExpeditions, false, 'expeditions', true, errMsg.createProduct),
  validateParam(constraints.createImages, false, 'images', true, errMsg.createProduct),
  wrap(ProductController.createProduct),
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

/**
 * POST /products/id/discussions
 * Create discussion
 */
routes.post('/products/:id/discussions',
  auth(),
  validateParam(constraints.discussion, true),
  wrap(ProductController.createDiscussion),
  apiResponse());

/**
 * GET /products/id/discussions/id/comments
 * Get all comments of a discussion
 */
routes.get('/products/:id/discussions/:discussion_id/comments',
  wrap(ProductController.getComments),
  apiResponse());

/**
 * POST /products/id/discussions/id/comments
 * Create comment
 */
routes.post('/products/:id/discussions/:discussion_id/comments',
  auth(),
  validateParam(constraints.comment, true),
  wrap(ProductController.createComment),
  apiResponse());

/**
 * POST /products/id/report
 * Report product
 */
routes.post('/products/:id/report',
  auth(),
  validateParam(constraints.report, true),
  wrap(ProductController.report),
  apiResponse());

export default routes;
