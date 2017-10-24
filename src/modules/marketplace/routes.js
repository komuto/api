import express from 'express';
import { MarketplaceController } from './controller';
import core from '../core';
import constraints from './validation';

const routes = express.Router();
const { apiResponse, validateParam } = core.middleware;
const { wrap } = core.utils;

/**
 * Get marketplace by domain
 */
routes.get('/marketplaces',
  validateParam(constraints.marketplace),
  wrap(MarketplaceController.find),
  apiResponse());

export default routes;
