const constraints = {};

constraints.cost = {
  weight: { presence: true },
  origin_ro_id: { presence: true },
  destination_ro_id: { presence: true },
};

constraints.costByProduct = {
  product_id: { presence: true },
  weight: { presence: true },
  origin_ro_id: { presence: true },
  destination_ro_id: { presence: true },
};

export default constraints;
