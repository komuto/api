import express from 'express';
import { validateLogin, addToken, userData } from './middleware';
import { UserController } from './controller';
import core from '../core';
import { apiResponse, auth } from '../core/middleware';
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
  auth(),
  UserController.getBalance,
  apiResponse());

routes.get('/users/address',
  auth(),
  wrap(AddressController.getPrimaryAddress),
  apiResponse());

/**
 * GET /users/profile
 * View user
 */
routes.get('/users/profile',
  auth(),
  wrap(UserController.getProfile),
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
  auth(),
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
 * GET /password-new?token
 * Check forgot password token
 */
routes.get('/password-new',
  wrap(UserController.checkToken),
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
