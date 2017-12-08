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
import { OTPController } from '../OTP/controller';
import core from '../core';
import constraints from './validation';
import productConstraints from './../product/validation';
import storeConstraints from './../store/validation';

const routes = express.Router();
const { apiResponse, auth, validateParam } = core.middleware;
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
  // wrap(UserController.createUser),
  // UserController.login,
  // addToken,
  // userData,
  apiResponse());

/**
 * PUT /users
 * Update user
 */
routes.put('/users',
  auth(),
  validateUpdate(),
  wrap(UserController.updateUser),
  apiResponse());

/**
 * PUT /accounts/profile
 * Update user account
 */
routes.put('/accounts/profile',
  auth(),
  validateUpdate(),
  wrap(UserController.updateUser),
  apiResponse());

/**
 * PUT /users/password
 * Change user password
 */
routes.put('/users/password',
  auth(),
  validateUpdate(),
  wrap(UserController.updatePassword),
  apiResponse());

/**
 * GET /users/wishlist
 * Get wishlist product
 */
routes.get('/users/wishlist',
  auth(),
  validateParam(constraints.wishlist),
  wrap(UserController.getWishlist),
  apiResponse());

/**
* PUT /users/store/expeditions
* Create/update expedition status
*/
routes.put('/users/store/expeditions',
  auth(),
  validateParam(productConstraints.updateExpeditions, true, null, true),
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
 * POST /signup-verification
 * Resend verification email
 */
routes.post('/signup-verification',
  auth(),
  wrap(UserController.resendVerification),
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

/**
 * GET /users/messages
 * Get list messages
 */
routes.get('/users/messages',
  auth(),
  validateParam(storeConstraints.get_messages),
  wrap(UserController.getMessages),
  apiResponse());

/**
 * GET /users/messages/id
 * Get detail message
 */
routes.get('/users/messages/:id([0-9]{1,10})',
  auth(),
  wrap(UserController.getMessage),
  apiResponse());

/**
 * PUT /users/messages/id
 * Update flag message
 */
routes.put('/users/messages/:id([0-9]{1,10})',
  auth(),
  validateParam(storeConstraints.update_message, true),
  wrap(UserController.updateMessage),
  apiResponse());

/**
 * DELETE /users/messages/id
 * Delete message
 */
routes.delete('/users/messages/:id([0-9]{1,10})',
  auth(),
  wrap(UserController.deleteMessage),
  apiResponse());

/**
 * POST /users/messages/id
 * Reply message
 */
routes.post('/users/messages/:id([0-9]{1,10})',
  auth(),
  validateParam(storeConstraints.reply_message, true),
  wrap(UserController.replyMessage),
  apiResponse());

/**
 * PUT /users/registration-token
 * Update registration token
 */
routes.put('/users/registration-token',
  auth(),
  validateParam(constraints.regToken, true),
  wrap(UserController.updateRegToken),
  apiResponse());

/**
 * GET /users/notifications
 * Get notification configuration
 */
routes.get('/users/notifications',
  auth(),
  wrap(UserController.getNotifications),
  apiResponse());

/**
 * POST /users/notifications
 * Save notification configuration
 */
routes.post('/users/notifications',
  auth(),
  validateParam(constraints.saveNotifications, true, 'notifications', true),
  wrap(UserController.saveNotifications),
  apiResponse());

/**
 * GET /users/resolutions
 * Get resolutions
 */
routes.get('/users/resolutions',
  auth(),
  validateParam(constraints.getResolutions),
  wrap(UserController.getResolutions),
  apiResponse());

/**
 * GET /users/resolutions/id
 * Get detail resolution
 */
routes.get('/users/resolutions/:id([0-9]{1,10})',
  auth(),
  wrap(UserController.getResolution),
  apiResponse());

/**
 * POST /users/resolutions
 * Create resolution
 */
routes.post('/users/resolutions',
  auth(),
  validateParam(constraints.createResolution, true),
  validateParam(constraints.resolutionImage, true, 'images', false),
  wrap(UserController.createResolution),
  apiResponse());

/**
 * POST /users/resolutions/id
 * Reply resolution
 */
routes.post('/users/resolutions/:id([0-9]{1,10})',
  auth(),
  validateParam(constraints.replyResolution, true),
  wrap(UserController.replyResolution),
  apiResponse());

/**
 * GET /pages/notification
 * Notification page
 */
routes.get('/pages/notification',
  auth(),
  wrap(UserController.getNotificationPage),
  apiResponse());

export default routes;
