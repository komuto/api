const constraints = {};

constraints.promo = {
  code: { presence: true },
};

constraints.cart = {
  product_id: { presence: true },
  expedition_id: { presence: true },
  expedition_service_id: { presence: true },
  qty: { presence: true },
  note: { presence: false },
  address_id: { presence: true },
  is_insurance: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'accept only `true` or `false` value',
    },
  },
  delivery_cost: { presence: true },
};

export default constraints;
