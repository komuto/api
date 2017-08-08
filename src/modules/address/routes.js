import express from 'express';
import { AddressController } from './controller';
import core from '../core';
import { validateCreate, validateUpdate } from './middleware';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;
const { apiResponse, auth } = core.middleware;

/**
 * GET /locations/provinces
 * View list of provinces
 */
routes.get('/locations/provinces',
  cache(),
  wrap(AddressController.getProvinces),
  apiResponse());

/**
 * GET /locations/districts
 * View list of districts
 */
routes.get('/locations/districts',
  cache(),
  wrap(AddressController.getDistricts),
  apiResponse());

/**
 * GET /locations/sub-districts
 * View list of sub districts
 */
routes.get('/locations/sub-districts',
  cache(),
  wrap(AddressController.getSubDistricts),
  apiResponse());

/**
 * GET /locations/villages
 * View list of villages
 */
routes.get('/locations/villages',
  cache(),
  wrap(AddressController.getVillages),
  apiResponse());

/**
 * POST /users/addresses
 * Create address
 */
routes.post('/users/addresses',
  auth(),
  validateCreate(),
  wrap(AddressController.createAddress),
  apiResponse());

routes.get('/users/address',
  auth(),
  wrap(AddressController.getPrimaryAddress),
  apiResponse());

routes.get('/users/store/address',
  auth(),
  wrap(AddressController.getStoreAddress),
  apiResponse());

routes.get('/users/addresses/:id([0-9]{1,10})',
  auth(),
  wrap(AddressController.getAddress),
  apiResponse());

routes.get('/users/addresses',
  auth(),
  wrap(AddressController.getListAddress),
  apiResponse());

/**
 * PUT /users/addresses/id
 * Change address
 */
routes.put('/users/addresses/:id([0-9]{1,10})',
  auth(),
  validateUpdate(),
  wrap(AddressController.updateAddress),
  apiResponse());

/**
 * DELETE /users/addresses/id
 * Delete address
 */
routes.delete('/users/addresses/:id([0-9]{1,10})',
  auth(),
  wrap(AddressController.deleteAddress),
  apiResponse());

export default routes;

