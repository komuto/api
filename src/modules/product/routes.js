import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import { validateParam } from './middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;
const cache = core.cache;

/**
 * GET /products
 * View list of products
 */
routes.get('/products',
  cache('5 minutes'),
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

export default routes;
