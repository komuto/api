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
  service: { presence: true },
  origin_ro_id: { presence: true, numericality: { onlyInteger: true } },
  destination_ro_id: { presence: true, numericality: { onlyInteger: true } },
};

constraints.checkout = {
  id: { presence: true },
  expedition_id: { presence: false },
  expedition_service_id: { presence: false },
  qty: { presence: false },
  note: { presence: false },
  address_id: { presence: false },
  is_insurance: {
    presence: false,
    inclusion: {
      within: [true, false],
      message: 'accept only `true` or `false` value',
    },
  },
  service: { presence: true },
  origin_ro_id: { presence: true, numericality: { onlyInteger: true } },
  destination_ro_id: { presence: true, numericality: { onlyInteger: true } },
};

export default constraints;
