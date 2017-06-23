import express from 'express';
import { CategoryController } from './controller';
import core from '../core';
import config from '../../../config';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware
const cache = core.cache;

/**
 * GET /categories
 * View list of categories
 */
routes.get('/categories',
  cache(config.cacheExp),
  wrap(CategoryController.getCategories),
  apiResponse());

/**
 * GET /categories/sub
 * View complete list of categories
 */
routes.get('/categories/sub',
  wrap(CategoryController.getFullCategories),
  apiResponse());

/**
 * GET /categories/:id/sub-categories
 * View list of sub categories
 */
routes.get('/categories/:id/sub-categories',
  cache(config.cacheExp),
  wrap(CategoryController.getCategories),
  apiResponse());

/**
 * GET /categories/id/brands
 * Get brand by category
 */
routes.get('/categories/:id/brands',
  wrap(CategoryController.getBrands),
  apiResponse());

export default routes;
