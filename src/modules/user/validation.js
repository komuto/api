import { errMsg } from './messages';

const { loginMsg, registrationMsg, updateMsg, OTPMsg } = errMsg;
const constraints = {};

/**
 * Login
 */
constraints.login = {
  email: {
    presence: { message: loginMsg.email_presence },
    email: { message: loginMsg.email_not_valid },
  },
  password: {
    presence: { message: loginMsg.password_presence },
  },
};

/**
 * Social login
 */
constraints.socialLogin = {
  provider_name: {
    presence: { message: loginMsg.provName_presence },
  },
  provider_uid: {
    presence: { message: loginMsg.uid_presence },
  },
  access_token: {
    presence: { message: loginMsg.token_presence },
  },
};

constraints.registration = {
  name: { presence: { message: registrationMsg.name_presence } },
  email: {
    presence: { message: registrationMsg.email_presence },
    email: { message: registrationMsg.email_not_valid },
  },
  password: { presence: { message: registrationMsg.password_presence } },
  gender: {
    presence: { message: registrationMsg.gender_presence },
    format: { pattern: /^male|female$/, message: registrationMsg.gender_not_valid },
  },
  phone_number: { presence: { message: registrationMsg.phone_presence } },
  reg_token: { presence: true },
};

constraints.update = {
  email: { email: { message: updateMsg.email_not_valid } },
  approval_cooperative_status: { format: { pattern: /^[0-4]$/, message: updateMsg.app_coop_not_valid } },
  gender: { format: { pattern: /^male|female$/, message: updateMsg.gender_not_valid } },
  status: { format: { pattern: /^[0-3]$/, message: updateMsg.status_not_valid } },
  place_of_birth: { numericality: {
    greaterThanOrEqualTo: 1000,
    lessThanOrEqualTo: 9999,
    message: updateMsg.place_not_valid } },
};

constraints.updatePhone = {
  phone_number: {
    presence: { message: updateMsg.phone_presence },
    format: { pattern: /^[0-9]+$/, message: updateMsg.phone_not_valid } },
};

constraints.verifyPhone = {
  code: {
    presence: { message: OTPMsg.presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: OTPMsg.not_valid } },
};

export default constraints;
