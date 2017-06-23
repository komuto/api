import express from 'express';
import { CategoryController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import config from '../../../config';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /categories
 * View list of categories
 */
routes.get('/categories',
  // cache(config.cacheExp),
  wrap(CategoryController.getDetailCategories),
  apiResponse());

/**
 * GET /categories/:id/sub-categories
 * View list of sub categories
 */
routes.get('/categories/:id/sub-categories',
  cache(config.cacheExp),
  wrap(CategoryController.getCategories),
  apiResponse());

export default routes;
