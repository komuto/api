import express from 'express';
import { CategoryController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;
const cache = core.cache;

/**
 * GET /categories
 * View list of categories
 */
routes.get('/categories',
  cache(),
  wrap(CategoryController.getListCategories),
  apiResponse());

/**
 * GET /categories/sub
 * View complete list of categories
 */
routes.get('/categories/sub',
  cache(),
  wrap(CategoryController.getFullCategories),
  apiResponse());

/**
 * GET /categories/:id
 * View list of sub categories
 */
routes.get('/categories/:id([0-9]{1,10})',
  cache(),
  wrap(CategoryController.getDetailCategories),
  apiResponse());

/**
 * GET /categories/id/brands
 * Get brand by category
 */
routes.get('/categories/:id([0-9]{1,10})/brands',
  wrap(CategoryController.getBrands),
  apiResponse());

export default routes;
