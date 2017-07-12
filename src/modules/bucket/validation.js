const constraints = {};

constraints.promo = {
  code: { presence: true },
};

constraints.cart = {
  product_id: { presence: true },
  expedition_service_id: { presence: true },
  qty: { presence: true },
  note: { presence: true },
  address_id: { presence: true },
  is_insurance: { presence: true },
  delivery_cost: { presence: true },
};

export default constraints;
