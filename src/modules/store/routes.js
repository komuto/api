import express from 'express';
import { StoreController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse, auth } = core.middleware;
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
 * Delete catalog store
 */
routes.delete('/users/store/catalogs/:id',
  auth(),
  wrap(StoreController.deleteCatalog),
  apiResponse());

export default routes;
