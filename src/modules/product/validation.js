const constraints = {};

constraints.list = {
  sort: {
    presence: false,
    inclusion: {
      within: ['newest', 'cheapest', 'expensive', 'selling'],
      message: 'accept only `newest`, `cheapest`, `expensive`, or `selling` value',
    },
  },
  price: {
    presence: false,
    format: {
      pattern: /^[1-9][\d]+-[1-9][\d]+/,
      message: 'only number with one `-` symbol between number. First char can\'t be 0. e.g. `500-1000`',
    },
  },
  condition: {
    presence: false,
    inclusion: {
      within: ['new', 'used'],
      message: 'accept only `new` or `used` value',
    },
  },
  other: {
    presence: false,
    format: {
      pattern: /^((discount|verified|wholesaler)+,)*(discount|verified|wholesaler)+$/,
      message: 'accept only `discount`, `verified`, and `wholesaler` value. Separated by comma',
    },
  },
  brands: {
    presence: false,
    format: {
      pattern: /^([\d]+,)*[\d]+$/,
      message: 'accept only number separated by comma',
    },
  },
  services: {
    presence: false,
    format: {
      pattern: /^([\d]+,)*[\d]+$/,
      message: 'accept only number separated by comma',
    },
  },
  address: {
    presence: false,
    format: {
      pattern: /^[\d]+/,
      message: 'accept only number (district_id)',
    },
  },
};

constraints.search = { q: { presence: true } };

constraints.discussion = { question: { presence: true } };

constraints.comment = { content: { presence: true } };

constraints.report = {
  type: { presence: true },
  report: { presence: true },
};

export default constraints;
