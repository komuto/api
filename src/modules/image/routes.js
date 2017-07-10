import express from 'express';
import { ImageController } from './controller';
import { utils, middleware } from '../core';
import { validateParam, imagePath } from './middleware';
import constraints from './validation';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

/**
 * POST /images
 * Upload images
 */
routes.post('/image',
  auth(),
  validateParam(constraints.single),
  imagePath(),
  wrap(ImageController.singleImage),
  apiResponse());

export default routes;
