const constraints = {};

constraints.list = {
  sort: {
    presence: false,
    inclusion: ['newest', 'cheapest', 'expensive', 'best-selling'],
  },
  price: {
    presence: false,
  },
  condition: {
    presence: false,
    inclusion: ['new', 'used'],
  },
  other: {
    presence: false,
  },
  brands: {
    presence: false,
  },
  services: {
    presence: false,
  },
};

constraints.search = {
  q: {
    presence: true,
  },
};

export default constraints;
