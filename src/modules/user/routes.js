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
  UserController.login,
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
 * GET /users/profile
 * View user
 */
routes.get('/users/profile',
  passport.authenticate('jwt', {
    failureRedirect: '/unauthorized',
  }),
  wrap(UserController.getProfile),
  apiResponse());

/**
 * GET /users/:id*?
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
  apiResponse());

/**
 * PUT /users/password
 * Change user password
 */
routes.put('/users/password',
  wrap(UserController.updatePassword),
  apiResponse());

/**
 * POST /passwords/forgot
 * Generate OTP sent through email
 */
routes.post('/passwords/forgot',
  wrap(UserController.forgotPassword),
  apiResponse());

/**
 * POST /accounts/email/check
 * Check whether email already used or not
 */
routes.post('/accounts/email/check',
  wrap(UserController.checkEmail),
  apiResponse());

/**
 * GET /signup-verification?token
 * Activate user account
 */
routes.get('/signup-verification',
  wrap(UserController.activateUser),
  apiResponse());

export default routes;
