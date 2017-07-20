import express from 'express';
import { ReviewController } from './controller';
import { utils, middleware } from '../core';

const routes = express.Router();
const { wrap } = utils;
const { apiResponse } = middleware;

/**
 * GET /reviews/search
 * Get list of reviews
 */
routes.get('/reviews/search',
  wrap(ReviewController.getReviews),
  apiResponse());

/**
 * GET /reviews/id
 * Get individual review
 */
routes.get('/reviews/:id([0-9]{1,10})',
  wrap(ReviewController.getReview),
  apiResponse());

export default routes;
