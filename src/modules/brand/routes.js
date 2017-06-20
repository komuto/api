import express from 'express';
import { BrandController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import config from '../../../config';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /brands
 * View list of brands
 */
routes.get('/brands',
  cache(config.cacheExp),
  wrap(BrandController.index),
  apiResponse());

export default routes;
