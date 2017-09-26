const constraints = {};

constraints.bank = {
  bank_account_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  date: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  amount: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  bank: { presence: true },
  holder_account_number: { presence: true },
  attachment: { presence: true },
};

constraints.bulkReview = {
  product_id: {
    presence: true,
    format: {
      pattern: '[0-9]{1,10}.[0-9]{1,10}',
      flags: 'i',
      message: 'not valid',
    },
  },
  review: { presence: true },
  quality: { presence: true, numericality: true },
  accuracy: { presence: true, numericality: true },
};

constraints.disputeBulkReview = {
  product_id: { presence: true, numericality: true },
  review: { presence: true },
  quality: { presence: true, numericality: true },
  accuracy: { presence: true, numericality: true },
};

constraints.dispute = {
  products: { presence: true },
  problems: { presence: true },
  solution: {
    presence: true,
    inclusion: {
      within: [1, 2],
      message: 'accept only 1 (refund), or 2 (exchange)',
    },
  },
  note: { presence: true },
  images: { presence: true },
};

constraints.listDispute = {
  is_resolved: {
    presence: false,
    inclusion: {
      within: ['true', 'false'],
      message: 'accept only boolean',
    },
  },
};

constraints.images = { name: { presence: true } };

constraints.airwayBill = { airway_bill: { presence: true } };

constraints.sales = {
  is_dropship: {
    presence: false,
    inclusion: {
      within: ['true', 'false'],
      message: 'accept only boolean',
    },
  },
};

constraints.getToken = {
  platform: {
    presence: true,
    inclusion: {
      within: ['web', 'pwa', 'apps'],
      message: 'accept only `web`, `pwa`, or `apps`',
    },
  },
};

export default constraints;
