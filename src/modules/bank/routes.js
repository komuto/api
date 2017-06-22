import express from 'express';
import { BankController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;

/**
 * GET /banks
 * View list of banks
 */
routes.get('/banks',
  wrap(BankController.getAll),
  apiResponse());

/**
 * GET /banks/:id
 * View bank detail
 */
routes.get('/banks/:id',
  wrap(BankController.getBank),
  apiResponse());

export default routes;
