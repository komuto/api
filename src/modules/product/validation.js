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
      pattern: /^[\d]+-[\d]+/,
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
  is_dropship: {
    presence: false,
    inclusion: {
      within: ['true', 'false'],
      message: 'Only accepts boolean',
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
    numericality: { onlyInteger: true },
  },
  brand_id: { numericality: { onlyInteger: true } },
  description: { presence: true },
  price: { presence: true, numericality: true },
  weight: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  stock: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  condition: {
    presence: true,
    inclusion: {
      within: [0, 1],
      message: 'must be number of 0 (used) or 1 (new)',
    },
  },
  is_insurance: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    },
  },
  is_dropship: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    },
  },
  catalog_id: { numericality: { onlyInteger: true } },
  expeditions: { presence: true },
  images: { presence: true },
};

constraints.createWholesale = {
  min_order: { presence: true, numericality: { onlyInteger: true } },
  max_order: { presence: true, numericality: { onlyInteger: true } },
  price: { presence: true, numericality: true },
};

constraints.updateWholesale = {
  id: { presence: true, numericality: { onlyInteger: true } },
  min_order: { presence: true, numericality: { onlyInteger: true } },
  max_order: { presence: true, numericality: { onlyInteger: true } },
  price: { presence: true, numericality: true },
};

constraints.createExpeditions = {
  expedition_service_id: { presence: true, numericality: { onlyInteger: true } },
};

constraints.updateExpeditions = {
  expedition_service_id: { presence: true, numericality: { onlyInteger: true } },
  status: {
    presence: true,
    inclusion: {
      within: [1, 2],
      message: 'accept only 1 (used) or 2 (unused)',
    },
  },
};

constraints.createImages = {
  name: { presence: true },
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

constraints.updateProduct = {
  stock: { presence: false, numericality: { onlyInteger: true } },
  is_dropship: {
    presence: false,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    },
  },
  is_wholesaler: {
    presence: false,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    },
  },
  status: {
    presence: false,
    inclusion: {
      within: [0, 1],
      message: 'Only accepts 0 (hide) or 1 (show)',
    },
  },
  images: { presence: false },
  catalog_id: { presence: false, numericality: { onlyInteger: true } },
  name: { presence: false },
  category_id: { presence: false, numericality: { onlyInteger: true } },
  brand_id: { presence: false, numericality: { onlyInteger: true } },
  description: { presence: false },
  price: { presence: false, numericality: { onlyInteger: true } },
  discount: { presence: false, numericality: { onlyInteger: true } },
  weight: { presence: false, numericality: { onlyInteger: true } },
  condition: {
    presence: false,
    inclusion: {
      within: [0, 1],
      message: 'must be number of 0 (used) or 1 (new)',
    },
  },
  is_insurance: {
    presence: false,
    inclusion: {
      within: [true, false],
      message: 'Only accepts boolean',
    },
  },
  wholesales: { presence: false },
  expeditions: { presence: false },
};

export default constraints;
