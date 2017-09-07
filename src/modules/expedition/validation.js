const constraints = {};

constraints.cost = {
  weight: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  origin_ro_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  destination_ro_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
};

constraints.costByProduct = {
  product_id: {
    presence: true,
    format: /([0-9]{1,10}.[0-9]{1,10})/,
  },
  weight: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  origin_ro_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  destination_ro_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
};

export default constraints;
