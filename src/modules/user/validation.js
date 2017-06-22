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

export default constraints;
