import express from 'express';
import { PaymentController } from './controller';
import core from '../core';

const routes = express.Router();
const { wrap } = core.utils;
const { apiResponse } = core.middleware;

routes.post('/payments',
  wrap(PaymentController.store),
  apiResponse());

export default routes;
