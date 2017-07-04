import { emailMsg, genderMsg } from './message';

const constraints = {};

/**
 * Login
 */
constraints.login = {
  email: {
    presence: true,
    email: { message: emailMsg.not_valid },
  },
  password: {
    presence: true,
  },
};

/**
 * Social login
 */
constraints.socialLogin = {
  provider_name: {
    presence: true,
  },
  provider_uid: {
    presence: true,
  },
  access_token: {
    presence: true,
  },
};

constraints.registration = {
  name: { presence: true },
  email: {
    presence: true,
    email: { message: emailMsg.not_valid },
  },
  password: { presence: true },
  gender: {
    presence: true,
    format: { pattern: /^male|female$/, message: genderMsg.not_valid },
  },
  phone_number: { presence: true },
};

constraints.update = {
  email: { email: { message: emailMsg.not_valid } },
  approval_cooperative_status: { pattern: /^[0-4]$/ },
  gender: { format: { pattern: /^male|female$/, message: genderMsg.not_valid } },
  status: { pattern: /^[0-3]$/ },
};

export default constraints;
