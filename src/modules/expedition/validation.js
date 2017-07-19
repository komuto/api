const constraints = {};

constraints.cost = {
  weight: {
    presence: true,
  },
  origin_ro_id: {
    presence: true,
  },
  destination_ro_id: {
    presence: true,
  },
};

const costByProduct = constraints.cost;
costByProduct.product_id = {
  presence: true,
};

constraints.costByProduct = costByProduct;

export default constraints;
