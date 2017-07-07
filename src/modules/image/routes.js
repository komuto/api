import express from 'express';
import { ImageController } from './controller';
import { utils, middleware } from '../core';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

/**
 * POST /images
 * Upload images
 */
routes.post('/image',
  auth(),
  wrap(ImageController.singleImage),
  apiResponse());

export default routes;
