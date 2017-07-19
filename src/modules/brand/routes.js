import express from 'express';
import { BrandController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';

const routes = express.Router();
const { wrap } = core.utils;
const cache = core.cache;

/**
 * GET /brands
 * View list of brands
 */
routes.get('/brands',
  cache(),
  wrap(BrandController.index),
  apiResponse());

export default routes;
