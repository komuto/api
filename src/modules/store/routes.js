import express from 'express';
import { StoreController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;
const cache = core.cache;

/**
 * GET /stores/id
 * Get full detailed store
 */
routes.get('/stores/:id',
  cache('5 minutes'),
  wrap(StoreController.getStore),
  apiResponse());

export default routes;
