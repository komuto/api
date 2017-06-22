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
  other: {
    presence: false,
  },
};

constraints.search = {
  q: {
    presence: true,
  },
};

export default constraints;
