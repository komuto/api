import express from 'express';
import { ProductController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /products
 * View list of products
 */
routes.get('/products',
  // cache('5 minutes'),
  wrap(ProductController.index),
  apiResponse());

export default routes;
