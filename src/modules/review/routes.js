import express from 'express';
import { ReviewController } from './controller';
import { utils, middleware } from '../core';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse } = middleware;

/**
 * GET /reviews/id
 * Get individual review
 */
routes.get('/reviews/:id',
  wrap(ReviewController.getReview),
  apiResponse());

export default routes;
