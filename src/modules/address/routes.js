import express from 'express';
import { AddressController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import config from '../../../config';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /locations/provinces
 * View list of provinces
 */
routes.get('/locations/provinces',
  cache(config.cacheExp),
  wrap(AddressController.getProvinces),
  apiResponse());

/**
 * GET /locations/districts
 * View list of districts
 */
routes.get('/locations/districts',
  cache(config.cacheExp),
  wrap(AddressController.getDistricts),
  apiResponse());

/**
 * GET /locations/sub-districts
 * View list of Sub districts
 */
routes.get('/locations/sub-districts',
  cache(config.cacheExp),
  wrap(AddressController.getSubDistricts),
  apiResponse());

export default routes;

