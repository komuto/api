import express from 'express';
import { ImageController } from './controller';
import { utils, middleware } from '../core';
import { validateParam, imagePath, validateParamMulti, imagePathMulti } from './middleware';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse, auth } = middleware;

/**
 * POST /image
 * Upload single image
 */
routes.post('/image',
  auth(),
  validateParam(),
  imagePath(),
  wrap(ImageController.singleImage),
  apiResponse());

/**
 * POST /images
 * Upload multi images
 */
routes.post('/images',
  auth(),
  validateParamMulti(),
  imagePathMulti(),
  wrap(ImageController.multiImages),
  apiResponse());

export default routes;
