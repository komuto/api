import express from 'express';
import {
  validateLogin,
  validateSocialLogin,
  addToken,
  userData,
  validateRegistration,
  validateUpdate,
  validateUpdatePhone,
  validateVerifyPhone,
} from './middleware';
import { UserController } from './controller';
import { controller } from '../OTP';
import core from '../core';
import constraints from './../store/validation';

const routes = express.Router();
const { apiResponse, auth, validateParam } = core.middleware;
const { wrap } = core.utils;
const { OTPController } = controller;

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
  validateSocialLogin(),
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

/**
 * GET /users/profile
 * View user
 */
routes.get('/users/profile',
  auth(),
  wrap(UserController.getUserProfile),
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
 * PUT /accounts/profile
 * Update user account
 */
routes.put('/accounts/profile',
  validateUpdate(),
  auth(),
  wrap(UserController.updateAccount),
  apiResponse());

/**
 * PUT /users/password
 * Change user password
 */
routes.put('/users/password',
  validateUpdate(),
  auth(),
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
* PUT /users/store/expeditions
* Create/update expedition status
*/
routes.put('/users/store/expeditions',
  auth(),
  wrap(UserController.updateExpeditions),
  apiResponse());

/**
 * GET /users/store/expeditions
 * Get the user's store expeditions
 */
routes.get('/users/store/expeditions',
  auth(),
  wrap(UserController.getUserExpeditions),
  apiResponse());

/**
 * GET /users/store/expeditions
 * Get the user's store expeditions
 */
routes.get('/users/store/expeditions/manage',
  auth(),
  wrap(UserController.getUserExpeditionsManage),
  apiResponse());

/**
 * POST /users/store
 * Create store
 */
routes.post('/users/store',
  auth(),
  validateParam(constraints.create, true),
  wrap(UserController.createStore),
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
 * GET /signup-verification?token
 * Activate user account
 */
routes.get('/signup-verification',
  wrap(UserController.activateUser),
  apiResponse());

/**
 * Get user account profile
 */
routes.get('/accounts/profile',
  auth(),
  wrap(UserController.getAccountProfile),
  apiResponse());

/**
 * Get user phone
 */
routes.get('/accounts/phone',
  auth(),
  UserController.getPhone,
  apiResponse());

/**
 * Update user phone
 */
routes.put('/accounts/phone',
  auth(),
  validateUpdatePhone(),
  wrap(UserController.updatePhone),
  wrap(OTPController.deleteOTPHP),
  apiResponse());

routes.post('/accounts/phone/verify',
  auth(),
  validateVerifyPhone(),
  wrap(OTPController.verifyOTPHPCode),
  apiResponse());

/**
 * Get user discussions
 */
routes.get('/users/discussions',
  auth(),
  wrap(UserController.getDiscussions),
  apiResponse());

/**
 * Get store discussions
 */
routes.get('/users/store/discussions',
  auth(),
  wrap(UserController.getStoreDiscussions),
  apiResponse());

export default routes;
