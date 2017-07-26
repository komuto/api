const constraints = {};

constraints.list = {
  q: { presence: false },
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
    numericality: {
      onlyInteger: true,
      greaterThan: 0,
    },
    length: {
      minimum: 1,
      maximum: 10,
    },
  },
  category_id: {
    presence: false,
    numericality: {
      onlyInteger: true,
      greaterThan: 0,
    },
    length: {
      minimum: 1,
      maximum: 10,
    },
  },
};

constraints.search = { q: { presence: true } };

constraints.discussion = { question: { presence: true } };

constraints.comment = { content: { presence: true } };

constraints.report = {
  report_type: {
    presence: true,
    numericality: {
      greaterThan: 0,
      lessThan: 6,
    },
  },
  description: { presence: true },
};

constraints.createProduct = {
  name: { presence: true },
  category_id: {
    presence: true,
    numericality: { onlyInteger: true } },
  brand_id: { numericality: { onlyInteger: true } },
  description: { presence: true },
  price: { presence: true, numericality: true },
  weight: {
    presence: true,
    numericality: { onlyInteger: true } },
  stock: {
    presence: true,
    numericality: { onlyInteger: true } },
  condition: {
    presence: true,
    format: { pattern: /^[0-1]$/, message: 'must be char of 0 or 1' } },
  insurance: {
    presence: true,
    format: { pattern: /^[0-1]$/, message: 'must be char of 0 or 1' } },
  is_dropship: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    } },
  catalog_id: { numericality: { onlyInteger: true } },
  expeditions: { presence: true },
  images: { presence: true },
};

constraints.createWholesale = {
  min_order: { numericality: { onlyInteger: true } },
  max_order: { numericality: { onlyInteger: true } },
  price: { numericality: true },
};

constraints.createExpeditions = {
  expedition_service_id: { presence: true, numericality: { onlyInteger: true } },
};

constraints.createImages = {
  image: { presence: true },
};

constraints.dropship = {
  catalog_id: { presence: true, numericality: true },
};

constraints.createReview = {
  review: { presence: true },
  quality: { presence: true, numericality: true },
  accuracy: { presence: true, numericality: true },
};

constraints.listStoreProduct = {
  q: { presence: false },
  hidden: {
    presence: false,
    inclusion: {
      within: ['true', 'false'],
      message: 'accept only `true` or `false` value',
    },
  },
};

constraints.productIds = {
  product_ids: { presence: true },
};

constraints.moveCatalog = {
  catalog_id: { presence: true, numericality: true },
  product_ids: { presence: true },
};

export default constraints;
