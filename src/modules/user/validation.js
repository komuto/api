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
    inclusion: { within: ['facebook'] },
  },
  provider_uid: {
    presence: { message: loginMsg.uid_presence },
  },
  access_token: {
    presence: { message: loginMsg.token_presence },
  },
  reg_token: { presence: false },
};

constraints.registration = {
  name: { presence: { message: registrationMsg.name_presence } },
  email: {
    presence: { message: registrationMsg.email_presence },
    email: { message: registrationMsg.email_not_valid },
  },
  password: {
    presence: { message: registrationMsg.password_presence },
    length: {
      minimum: 5,
      message: registrationMsg.password_length,
    },
  },
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
  place_of_birth: {
    numericality: {
      greaterThanOrEqualTo: 1000,
      lessThanOrEqualTo: 9999,
      message: updateMsg.place_not_valid,
    },
  },
};

constraints.updatePhone = {
  phone_number: {
    presence: { message: updateMsg.phone_presence },
    format: { pattern: /^[0-9]+$/, message: updateMsg.phone_not_valid },
  },
};

constraints.verifyPhone = {
  code: {
    presence: { message: OTPMsg.presence },
    numericality: {
      greaterThanOrEqualTo: 10000,
      lessThanOrEqualTo: 99999,
      message: OTPMsg.not_valid,
    },
  },
};

constraints.regToken = { reg_token: { presence: true } };

constraints.saveNotifications = {
  type: {
    presence: true,
    inclusion: {
      within: [1, 2, 3, 4, 5],
      message: 'accept only value 1-5',
    },
  },
  is_active: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'accept only boolean',
    },
  },
};

constraints.getResolutions = {
  is_closed: {
    inclusion: {
      within: ['true', 'false'],
      message: 'accept only boolean',
    },
  },
};

constraints.createResolution = {
  priority: {
    presence: true,
    inclusion: {
      within: [1, 2, 3],
      message: 'accept only `1` (low), `2` (medium), or `3` (high)',
    },
  },
  topic: {
    presence: true,
    inclusion: {
      within: [1, 2, 3, 4],
      message: 'accept only `1` (general), `2` (info), `3` (transaction), or `4` (etc)',
    },
  },
  title: { presence: true },
  message: { presence: true },
};

constraints.resolutionImage = {
  name: { presence: true },
};

constraints.replyResolution = { message: { presence: true } };

constraints.wishlist = {
  q: { presence: false },
  sort: {
    presence: false,
    inclusion: {
      within: ['newest', 'cheapest', 'expensive', 'selling'],
      message: 'accept only `newest`, `cheapest`, `expensive`, or `selling` value',
    },
  },
};

export default constraints;
