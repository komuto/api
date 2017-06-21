const constraints = {};

constraints.list = {
  sort: {
    presence: false,
    inclusion: ['newest', 'cheapest', 'expensive', 'best-selling'],
  },
};

constraints.search = {
  q: {
    presence: true,
  },
};

export default constraints;
