import { emailMsg, genderMsg, passwordMsg, providerNameMsg, uidMsg, tokenMsg, nameMsg, phoneNumberMsg } from './message';

const constraints = {};

/**
 * Login
 */
constraints.login = {
  email: {
    presence: { message: emailMsg.presence },
    email: { message: emailMsg.not_valid },
  },
  password: {
    presence: { message: passwordMsg.presence },
  },
};

/**
 * Social login
 */
constraints.socialLogin = {
  provider_name: {
    presence: { message: providerNameMsg.presence },
  },
  provider_uid: {
    presence: { message: uidMsg.presence },
  },
  access_token: {
    presence: { message: tokenMsg.presence },
  },
};

constraints.registration = {
  name: { presence: { message: nameMsg.presence } },
  email: {
    presence: { message: emailMsg.presence },
    email: { message: emailMsg.not_valid },
  },
  password: { presence: { message: passwordMsg.presence } },
  gender: {
    presence: { message: genderMsg.presence },
    format: { pattern: /^male|female$/, message: genderMsg.not_valid },
  },
  phone_number: { presence: { message: phoneNumberMsg.presence } },
};

constraints.update = {
  email: { email: { message: emailMsg.not_valid } },
  approval_cooperative_status: { pattern: /^[0-4]$/ },
  gender: { format: { pattern: /^male|female$/, message: genderMsg.not_valid } },
  status: { pattern: /^[0-3]$/ },
};

export default constraints;
