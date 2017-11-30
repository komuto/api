import express from 'express';
import { MarketplaceController } from './controller';
import core from '../core';

const routes = express.Router();
const { apiResponse } = core.middleware;
const { wrap } = core.utils;

/**
 * Get marketplace data
 */
routes.get('/marketplace',
  wrap(MarketplaceController.get),
  apiResponse());

/**
 * Get marketplace commission data
 */
routes.get('/marketplace/commission',
  wrap(MarketplaceController.getCommission),
  apiResponse());

/**
 * Get banners
 */
routes.get('/banners',
  wrap(MarketplaceController.getBanners),
  apiResponse());

/**
 * Get manifest.json
 */
routes.get('/manifest.json', wrap(MarketplaceController.getManifest));

export default routes;
