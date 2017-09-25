import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import constraints from './validation';
import { validateManageProductsParam } from './middleware';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;

/**
 * GET /products
 * View list of products
 */
routes.get('/products',
  auth(false),
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
 * GET /users/store/products/hidden
 * View hidden products
 */
routes.get('/users/store/products/hidden',
  auth(),
  wrap(ProductController.hiddenStoreProducts),
  apiResponse());

/**
 * GET /users/store/products/catalogs/id/list
 * View own products based on catalog id for multiple check
 */
routes.get('/users/store/products/catalogs/:id([0-9]{1,10})/list',
  auth(),
  validateParam(constraints.listStoreCatalogProducts),
  wrap(ProductController.listStoreCatalogProducts),
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
 * GET /products/id
 * Get full detailed product
 */
routes.get('/products/:id([0-9]{1,10}.[0-9]{1,10})',
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
 * GET /products/id/wishlist
 * Add to wishlist
 */
routes.get('/products/:id([0-9]{1,10}.[0-9]{1,10})/wishlist',
  auth(),
  wrap(ProductController.addWishlist),
  apiResponse());

/**
 * GET /products/id/discussions
 * Get all discussions of a product
 */
routes.get('/products/:id([0-9]{1,10}.[0-9]{1,10})/discussions',
  wrap(ProductController.getDiscussions),
  apiResponse());

/**
 * POST /products/id/discussions
 * Create discussion
 */
routes.post('/products/:id([0-9]{1,10}.[0-9]{1,10})/discussions',
  auth(),
  validateParam(constraints.discussion, true),
  wrap(ProductController.createDiscussion),
  apiResponse());

/**
 * GET /discussions/id/comments
 * Get all comments of a discussion
 */
routes.get('/discussions/:id([0-9]{1,10})/comments',
  wrap(ProductController.getComments),
  apiResponse());

/**
 * POST /discussions/id/comments
 * Create comment
 */
routes.post('/discussions/:id([0-9]{1,10})/comments',
  auth(),
  validateParam(constraints.comment, true),
  wrap(ProductController.createComment),
  apiResponse());

/**
 * POST /products/id/report
 * Report product
 */
routes.post('/products/:id([0-9]{1,10}.[0-9]{1,10})/report',
  auth(),
  validateParam(constraints.report, true),
  wrap(ProductController.report),
  apiResponse());

/**
 * Get products for dropshipping
 */
routes.get('/products/dropship',
  auth(),
  wrap(ProductController.getDropshipProducts),
  wrap(ProductController.index),
  apiResponse());

/**
 * POST /products/id/dropship
 * Dropship product
 */
routes.post('/products/:id([0-9]{1,10}.[0-9]{1,10})/dropship',
  auth(),
  validateParam(constraints.dropship, true),
  wrap(ProductController.dropship),
  apiResponse());

/**
 * DELETE /users/store/products/id
 * Delete dropship product
 */
routes.delete('/users/store/products/:id([0-9]{1,10})',
  auth(),
  wrap(ProductController.deleteDropship),
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
 * Hide/show products
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
 * POST /users/store/products/dropships
 * Update status dropship
 */
routes.post('/users/store/products/dropships',
  auth(),
  validateManageProductsParam(constraints.productIds),
  wrap(ProductController.bulkUpdateDropship),
  apiResponse());

/**
 * GET /users/store/products/id
 * Get store product
 */
routes.get('/users/store/products/:id([0-9]{1,10})',
  auth(),
  wrap(ProductController.getStoreProduct),
  apiResponse());

/**
 * PUT /users/store/products/id
 * Update product
 */
routes.put('/users/store/products/:id([0-9]{1,10})',
  auth(),
  validateParam(constraints.updateProduct, true),
  validateParam(constraints.updateWholesale, false, 'wholesales'),
  validateParam(constraints.updateExpeditions, false, 'expeditions'),
  validateParam(constraints.createImages, false, 'images'),
  wrap(ProductController.updateProduct),
  apiResponse());

/**
 * GET /users/store/products/id/expeditions
 * Get the user's store expeditions
 */
routes.get('/users/store/products/:id([0-9]{1,10})/expeditions/manage',
  auth(),
  wrap(ProductController.getProductExpeditionsManage),
  apiResponse());

/**
 * GET /commissions
 * Get share fee
 */
routes.get('/commissions',
  auth(),
  validateParam({ price: { presence: true, numericality: { onlyInteger: true } } }),
  wrap(ProductController.getCommission),
  apiResponse());

export default routes;
