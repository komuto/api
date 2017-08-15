import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import constraints from './validation';
import { ReviewController } from '../review';
import { validateManageProductsParam } from './middleware';

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
 * GET /users/store/products
 * View own products
 */
routes.get('/users/store/products',
  auth(),
  validateParam(constraints.listStoreProduct),
  wrap(ProductController.storeProducts),
  apiResponse());

/**
 * GET /users/store/products/catalogs/id
 * View own products based on catalog id
 */
routes.get('/users/store/products/catalogs/:id([0-9]{1,10})?',
  auth(),
  wrap(ProductController.storeCatalogProducts),
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
routes.post('/products/:id([0-9]{1,10})/reviews',
  auth(),
  validateParam(constraints.createReview, true),
  wrap(ReviewController.createReview),
  apiResponse());

/**
 * GET /products/id
 * Get full detailed product
 */
routes.get('/products/:id([0-9]{1,10})',
  auth(false),
  wrap(ProductController.getProduct),
  apiResponse());

/**
 * Create product
 */
routes.post('/products',
  auth(),
  validateParam(constraints.createProduct, true),
  validateParam(constraints.createWholesale, false, 'wholesales', false),
  validateParam(constraints.createExpeditions, false, 'expeditions', true),
  validateParam(constraints.createImages, false, 'images', true),
  wrap(ProductController.createProduct),
  apiResponse());

/**
 * GET /products/id/reviews
 * Get all reviews of a product
 */
routes.get('/products/:id([0-9]{1,10})/reviews',
  wrap(ReviewController.getReviews),
  apiResponse());

/**
 * GET /products/id/wishlist
 * Add to wishlist
 */
routes.get('/products/:id([0-9]{1,10})/wishlist',
  auth(),
  wrap(ProductController.addWishlist),
  apiResponse());

/**
 * GET /products/id/discussions
 * Get all discussions of a product
 */
routes.get('/products/:id([0-9]{1,10})/discussions',
  wrap(ProductController.getDiscussions),
  apiResponse());

/**
 * POST /products/id/discussions
 * Create discussion
 */
routes.post('/products/:id([0-9]{1,10})/discussions',
  auth(),
  validateParam(constraints.discussion, true),
  wrap(ProductController.createDiscussion),
  apiResponse());

/**
 * GET /products/id/discussions/discussion_id/comments
 * Get all comments of a discussion
 */
routes.get('/products/:id([0-9]{1,10})/discussions/:discussion_id([0-9]{1,10})/comments',
  wrap(ProductController.getComments),
  apiResponse());

/**
 * POST /products/id/discussions/discussion_id/comments
 * Create comment
 */
routes.post('/products/:id([0-9]{1,10})/discussions/:discussion_id([0-9]{1,10})/comments',
  auth(),
  validateParam(constraints.comment, true),
  wrap(ProductController.createComment),
  apiResponse());

/**
 * POST /products/id/report
 * Report product
 */
routes.post('/products/:id([0-9]{1,10})/report',
  auth(),
  validateParam(constraints.report, true),
  wrap(ProductController.report),
  apiResponse());

/**
 * POST /products/id/dropship
 * Dropship product
 */
routes.post('/products/:id([0-9]{1,10})/dropship',
  auth(),
  validateParam(constraints.dropship, true),
  wrap(ProductController.dropship),
  apiResponse());

/**
 * POST /users/store/products/hides
 * Hide products
 */
routes.post('/users/store/products/hides',
  auth(),
  validateManageProductsParam(constraints.productIds),
  wrap(ProductController.hides),
  apiResponse());

/**
 * POST /users/store/products/move-catalog
 * Hide products
 */
routes.post('/users/store/products/move-catalog',
  auth(),
  validateManageProductsParam(constraints.moveCatalog),
  wrap(ProductController.moveCatalog),
  apiResponse());

/**
 * POST /users/store/products
 * Delete products
 */
routes.post('/users/store/products',
  auth(),
  validateManageProductsParam(constraints.productIds),
  wrap(ProductController.bulkDelete),
  apiResponse());

/**
 * GET /users/store/products/id
 * Get store product
 */
routes.get('/users/store/products/:id([0-9]{1,10})',
  auth(),
  wrap(ProductController.getStoreProduct),
  apiResponse());

export default routes;
