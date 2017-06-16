import express from 'express';
import passport from 'passport';
import { validateLogin, addToken, userData } from './middleware';
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
  addToken,
  userData,
  apiResponse());

/**
 * POST /social-login
 * Authenticate user using social media
 */
routes.post('/users/social-login',
  validateLogin({ social: true }),
  wrap(UserController.getUserSocial),
  addToken,
  userData,
  apiResponse());

/**
 * GET /:id*?
 * View user
 */
routes.get('/users/:id*?',
  passport.authenticate('jwt', {}),
  wrap(UserController.getOneUser),
  userData,
  apiResponse());

/**
 * POST /
 * Create user
 */
routes.post('/users',
  wrap(UserController.createUser),
  apiResponse());

export default routes;
