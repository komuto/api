const constraints = {};

/**
 * Login
 */
constraints.login = {
  email: {
    presence: true,
    email: { message: 'is not a valid email' },
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
};

constraints.registration = {
  name: { presence: true },
  email: {
    presence: true,
    email: { message: 'is not a valid email' },
  },
  password: { presence: true },
  gender: {
    presence: true,
    format: { pattern: /^male|female$/, message: 'is not a valid gender' },
  },
  phone_number: { presence: true },
};

constraints.update = {
  email: { email: { message: 'is not a valid email' } },
  approval_cooperative_status: { pattern: /^[0-4]$/ },
  gender: { format: { pattern: /^male|female$/, message: 'is not a valid gender' } },
  status: { pattern: /^[0-3]$/ },
};

export default constraints;
