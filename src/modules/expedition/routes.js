import express from 'express';
import { ExpeditionController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import { validateParam } from './middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /expeditions
 * View list of expeditions
 */
routes.get('/expeditions',
  cache(),
  wrap(ExpeditionController.getExpeditions),
  apiResponse());

/**
 * GET /expeditions/services
 * View list of services
 */
routes.get('/expeditions/services',
  cache(),
  wrap(ExpeditionController.getListExpeditionServices),
  apiResponse());

/**
 * GET /expeditions/:id/services
 * View expedition service
 */
routes.get('/expeditions/:id/services',
  cache(),
  wrap(ExpeditionController.getExpeditionService),
  apiResponse());

/**
 * GET /expeditions/:id/cost
 * View expedition cost
 */
routes.post('/expeditions/:id/cost',
  validateParam(constraints.cost),
  wrap(ExpeditionController.getExpeditionCost),
  apiResponse());

export default routes;
