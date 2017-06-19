import express from 'express';
import { CategoryController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';

const routes = express.Router();
const { wrap } = core.utils;

/**
 * GET /categories
 * View list of categories
 */
routes.get('/categories',
  wrap(CategoryController.getCategories),
  apiResponse());

/**
 * GET /categories/:id/sub-categories
 * View list of sub categories
 */
routes.get('/categories/:id/sub-categories',
  wrap(CategoryController.getCategories),
  apiResponse());

export default routes;
