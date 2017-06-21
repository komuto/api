const constraints = {};

/**
 * Login
 */
constraints.search = {
  sort: {
    presence: true,
    inclusion: ['newest', 'cheapest', 'expensive', 'best-selling'],
  },
};

export default constraints;
