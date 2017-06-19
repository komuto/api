import express from 'express';
import { ExpeditionController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import config from '../../../config';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /expeditions
 * View list of expeditions
 */
routes.get('/expeditions',
  cache(config.cacheExp),
  wrap(ExpeditionController.getExpeditions),
  apiResponse());

/**
 * GET /expeditions/services
 * View list of services
 */
routes.get('/expeditions/services',
  cache(config.cacheExp),
  wrap(ExpeditionController.getExpeditionServices),
  apiResponse());

export default routes;
