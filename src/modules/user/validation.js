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
  gender: { presence: true },
  phone_number: { presence: true },
};


export default constraints;
