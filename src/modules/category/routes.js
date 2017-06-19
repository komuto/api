import express from 'express';
import apicache from 'apicache';
import redis from 'redis';
import { CategoryController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import config from '../../../config';

const cache = apicache
  .options({ redisClient: redis.createClient() })
  .middleware;

const routes = express.Router();
const { wrap } = core.utils;

/**
 * GET /categories
 * View list of categories
 */
routes.get('/categories',
  cache(config.cacheExp),
  wrap(CategoryController.getCategories),
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
