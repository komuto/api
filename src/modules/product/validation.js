const constraints = {};

/**
 * Login
 */
constraints.search = {
  sort: {
    presence: false,
    inclusion: ['newest', 'cheapest', 'expensive', 'best-selling'],
  },
};

export default constraints;
