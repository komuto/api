import express from 'express';
import passport from 'passport';
import { validateLogin } from './middleware';
import { UserController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';

const routes = express.Router();
const { wrap } = core.utils;
/**
 * POST /login
 * Authenticate user
 */
routes.post('/users/login',
  validateLogin(),
  passport.authenticate('local-login'),
  wrap(UserController.getUser),
  apiResponse());

/**
 * GET /:id*?
 * View user
 */
routes.get('/users/:id*?',
  passport.authenticate('jwt', {}),
  wrap(UserController.getUser),
  apiResponse());

/**
 * POST /
 * Create user
 */
routes.post('/users',
  passport.authenticate('jwt', {}),

  wrap(UserController.createUser),
  apiResponse());

export default routes;
