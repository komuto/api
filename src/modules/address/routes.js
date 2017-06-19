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

export default routes;

