import express from 'express';
import passport from 'passport';
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
 * View list of sub districts
 */
routes.get('/locations/sub-districts',
  cache(config.cacheExp),
  wrap(AddressController.getSubDistricts),
  apiResponse());

/**
 * GET /locations/villages
 * View list of villages
 */
routes.get('/locations/villages',
  cache(config.cacheExp),
  wrap(AddressController.getVillages),
  apiResponse());

/**
 * POST /users/addresses
 * Create address
 */
routes.post('/users/addresses',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(AddressController.createAddress),
  apiResponse());

/**
 * PUT /users/addresses/id
 * Change address
 */
routes.put('/users/addresses',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(AddressController.updatePrimaryAddress),
  apiResponse());

/**
 * DELETE /users/addresses/id
 * Delete address
 */
routes.delete('/users/addresses/:id',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(AddressController.deleteAddress),
  apiResponse());

export default routes;

