import express from 'express';
import passport from 'passport';
import { validateLogin, addToken, userData } from './middleware';
import { UserController } from './controller';
import core from '../core';
import { apiResponse } from '../core/middleware';
import { AddressController } from '../address/controller';

const routes = express.Router();
const { wrap } = core.utils;

/**
 * POST /login
 * Authenticate user
 */
routes.post('/users/login',
  validateLogin(),
  passport.authenticate('local-login', {
    failureRedirect: '/unauthorized',
  }),
  addToken,
  userData,
  apiResponse());

/**
 * POST /unauthorized
 * Unauthorized user
 */
routes.get('/unauthorized',
  (req, res) => {
    res.json({
      status: false,
      code: 401,
      message: 'unauthorized',
      data: {},
    });
  });

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
 * GET /users/balance
 */
routes.get('/users/balance',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  UserController.getBalance,
  apiResponse());

routes.get('/users/address',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(AddressController.getAddress),
  apiResponse());

/**
 * GET /:id*?
 * View user
 */
routes.get('/users/:id*?',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(UserController.getOneUser),
  userData,
  apiResponse());

/**
 * POST /
 * Create user
 */
routes.post('/users',
  wrap(UserController.createUser),
  userData,
  apiResponse());

/**
 * PUT /users
 * Update user
 */
routes.put('/users',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(UserController.updateUser),
  userData,
  apiResponse());

/**
 * PUT /users/password
 * Change user password
 */
routes.put('/users/password',
  wrap(UserController.updatePassword),
  userData,
  apiResponse());

export default routes;
