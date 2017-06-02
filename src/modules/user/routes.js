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
routes.post('/user/login',
  validateLogin(),
  passport.authenticate('local-login', { session: false }),
  wrap(UserController.getUser),
  apiResponse());

/**
 * GET /profile/:id*?
 * View user profile
 */
routes.get('/user/:id*?',
  passport.authenticate('jwt', {}),
  wrap(UserController.getUser),
  apiResponse());

export default routes;
