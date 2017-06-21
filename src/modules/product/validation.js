const constraints = {};

constraints.list = {
  sort: {
    presence: false,
    inclusion: ['newest', 'cheapest', 'expensive', 'best-selling'],
  },
  condition: {
    presence: false,
    inclusion: ['new', 'used'],
  },
};

constraints.search = {
  q: {
    presence: true,
  },
};

export default constraints;
