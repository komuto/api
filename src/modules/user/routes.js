import express from 'express';
import { validateLogin, addToken, userData, validateRegistration, validateUpdate } from './middleware';
import { UserController } from './controller';
import core from '../core';
import { AddressController } from '../address/controller';

const routes = express.Router();
const { apiResponse, auth } = core.middleware;
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

routes.get('/users/addresses/:id',
  auth(),
  wrap(AddressController.getAddress),
  apiResponse());

routes.get('/users/addresses',
  auth(),
  wrap(AddressController.getListAddress),
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
 * Register user
 */
routes.post('/users',
  validateRegistration(),
  wrap(UserController.createUser),
  UserController.login,
  addToken,
  userData,
  apiResponse());

/**
 * PUT /users
 * Update user
 */
routes.put('/users',
  validateUpdate(),
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
 * GET /users/wishlist
 * Get wishlist product
 */
routes.get('/users/wishlist',
  auth(),
  wrap(UserController.getWishlist),
  apiResponse());

/**
 * POST /passwords/forgot
 * Generate reset link sent through email
 */
routes.post('/passwords/forgot',
  wrap(UserController.forgotPassword),
  apiResponse());

/**
 * GET /passwords/new?token
 * Check forgot password token
 */
routes.get('/passwords/new',
  wrap(UserController.checkToken),
  apiResponse());

/**
 * PUT /passwords/new
 * Update new password
 */
routes.put('/passwords/new',
  wrap(UserController.checkToken),
  wrap(UserController.resetPassword),
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
