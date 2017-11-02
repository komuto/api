import express from 'express';
import { StoreController } from './controller';
import core from '../core';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;

/**
 * GET /stores/id
 * Get full detailed store
 */
routes.get('/stores/:id([0-9]{1,10})',
  auth(false),
  wrap(StoreController.getStore),
  apiResponse());

/**
 * GET /stores/id/reviews
 * Get store reviews
 */
routes.get('/stores/:id([0-9]{1,10})/reviews',
  wrap(StoreController.getStoreReviews),
  apiResponse());

/**
 * Favorite or delete store
 */
routes.put('/stores/:id([0-9]{1,10})/favorite',
  auth(),
  wrap(StoreController.favorite),
  apiResponse());

/**
* GET /users/store/catalogs
* Get the user's store catalogs
*/
routes.get('/users/store/catalogs',
  auth(),
  wrap(StoreController.getUserCatalog),
  apiResponse());

/**
 * Get favorite store list
 */
routes.get('/users/store/favorites',
  auth(),
  wrap(StoreController.listFavorites),
  apiResponse());

/**
 * Delete catalog store
 */
routes.delete('/users/store/catalogs/:id([0-9]{1,10})',
  auth(),
  wrap(StoreController.deleteCatalog),
  apiResponse());

/**
 * POST /stores/id/message
 * Message store
 */
routes.post('/stores/:id([0-9]{1,10})/message',
  auth(),
  validateParam(constraints.create_message, true),
  wrap(StoreController.createMessage),
  apiResponse());

/**
 * POST /invoices/id/buyer/message
 * Message buyer
 */
routes.post('/invoices/:id([0-9]{1,10})/buyer/message',
  auth(),
  validateParam(constraints.create_message, true),
  wrap(StoreController.messageBuyer),
  wrap(StoreController.createMessage),
  apiResponse());

/**
 * POST /invoices/id/seller/message
 * Message seller
 */
routes.post('/invoices/:id([0-9]{1,10})/seller/message',
  auth(),
  validateParam(constraints.create_message, true),
  wrap(StoreController.messageSeller),
  wrap(StoreController.createMessage),
  apiResponse());

/**
 * POST /invoices/id/reseller/message
 * Message reseller
 */
routes.post('/invoices/:id([0-9]{1,10})/reseller/message',
  auth(),
  validateParam(constraints.create_message, true),
  wrap(StoreController.messageReseller),
  wrap(StoreController.createMessage),
  apiResponse());

/**
 * POST /users/store/catalogs
 * Create catalog
 */
routes.post('/users/store/catalogs',
  auth(),
  validateParam(constraints.catalog, true),
  wrap(StoreController.createCatalog),
  apiResponse());

/**
 * GET /users/store/catalogs/id
 * Get catalog
 */
routes.get('/users/store/catalogs/:id([0-9]{1,10})',
  auth(),
  wrap(StoreController.getCatalog),
  apiResponse());

/**
 * PUT /users/store/catalogs/id
 * Update catalog
 */
routes.put('/users/store/catalogs/:id([0-9]{1,10})',
  auth(),
  validateParam(constraints.catalog, true),
  wrap(StoreController.updateCatalog),
  apiResponse());

/**
 * POST /users/store/verify
 * Verify store
 */
routes.post('/users/store/verify',
  auth(),
  validateParam(constraints.verify, true),
  wrap(StoreController.verify),
  apiResponse());

/**
 * POST /users/store
 * Create store
 */
routes.post('/users/store',
  auth(),
  validateParam(constraints.create, true),
  wrap(StoreController.createStore),
  apiResponse());

/**
 * PUT /users/store
 * Update store
 */
routes.put('/users/store',
  auth(),
  validateParam(constraints.update, true),
  wrap(StoreController.updateStore),
  apiResponse());

/**
 * PUT /users/store/term-condition
 * Update term condition
 */
routes.put('/users/store/term-condition',
  auth(),
  validateParam(constraints.update_term, true),
  wrap(StoreController.updateStore),
  apiResponse());

/**
 * GET /users/store/messages
 * Get list messages
 */
routes.get('/users/store/messages',
  auth(),
  validateParam(constraints.get_messages),
  wrap(StoreController.getMessages),
  apiResponse());

/**
 * GET /users/store/messages/id
 * Get detail messages
 */
routes.get('/users/store/messages/:id([0-9]{1,10})',
  auth(),
  wrap(StoreController.getMessage),
  apiResponse());

/**
 * PUT /users/store/messages/id/archive
 * Update flag message
 */
routes.put('/users/store/messages/:id([0-9]{1,10})',
  auth(),
  validateParam(constraints.update_message, true),
  wrap(StoreController.updateMessage),
  apiResponse());

/**
 * DELETE /users/store/messages/id
 * Delete message
 */
routes.delete('/users/store/messages/:id([0-9]{1,10})',
  auth(),
  wrap(StoreController.deleteMessage),
  apiResponse());

/**
 * POST /users/store/messages/id
 * Reply message
 */
routes.post('/users/store/messages/:id([0-9]{1,10})',
  auth(),
  validateParam(constraints.reply_message, true),
  wrap(StoreController.replyMessage),
  apiResponse());

/**
 * GET /pages/store
 * Store page
 */
routes.get('/pages/store',
  auth(),
  wrap(StoreController.getPage),
  apiResponse());

export default routes;
