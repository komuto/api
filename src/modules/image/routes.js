import express from 'express';
import { ImageController } from './controller';
import { utils, middleware } from '../core';
import { validateParam, imagePath } from './middleware';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

/**
 * POST /images
 * Upload multi images
 */
routes.post('/images',
  auth(),
  validateParam(),
  imagePath(),
  wrap(ImageController.upload),
  apiResponse());

export default routes;
