import express from 'express';
import { StoreController } from './controller';
import core from '../core';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth, validateParam } = core.middleware;
const cache = core.cache;

/**
 * GET /stores/id
 * Get full detailed store
 */
routes.get('/stores/:id',
  cache('5 minutes'),
  wrap(StoreController.getStore),
  apiResponse());

/**
 * POST /stores/id/favorite
 * Make a store favorite
 */
routes.post('/stores/:id/favorite',
  auth(),
  wrap(StoreController.makeFavorite),
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
routes.delete('/users/store/catalogs/:id',
  auth(),
  wrap(StoreController.deleteCatalog),
  apiResponse());

/**
 * POST /stores/id/message
 * Message store
 */
routes.post('/stores/:id/message',
  auth(),
  validateParam(constraints.createMessage, true),
  wrap(StoreController.createMessage),
  apiResponse());

export default routes;
