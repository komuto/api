import express from 'express';
import { ExpeditionController } from './controller';
import core from '../core';
import { apiResponse, validateParam } from '../core/middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /expeditions
 * View list of expeditions
 */
routes.get('/expeditions',
  cache('7 days'),
  wrap(ExpeditionController.getExpeditions),
  apiResponse());

/**
 * GET /expeditions/services
 * View list of services
 */
routes.get('/expeditions/services',
  cache('7 days'),
  wrap(ExpeditionController.getListExpeditionServices),
  apiResponse());

/**
 * GET /expeditions/:id/services
 * View expedition service
 */
routes.get('/expeditions/:id([0-9]{1,10})/services',
  cache('7 days'),
  wrap(ExpeditionController.getExpeditionService),
  apiResponse());

/**
 * GET /expeditions/:id/cost
 * View expedition cost
 */
routes.get('/expeditions/:id([0-9]{1,10})/cost',
  validateParam(constraints.cost),
  wrap(ExpeditionController.getExpeditionCost),
  apiResponse());

/**
 * GET /expeditions/cost
 * View expedition cost by product id
 */
routes.get('/expeditions/cost',
  validateParam(constraints.costByProduct),
  cache(),
  wrap(ExpeditionController.getExpeditionCostByProduct),
  apiResponse());

export default routes;
