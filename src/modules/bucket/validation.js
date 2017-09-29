const constraints = {};

constraints.promo = {
  code: { presence: true },
};

constraints.cart = {
  product_id: { presence: true },
  expedition_id: { presence: true, numericality: { onlyInteger: true } },
  expedition_service_id: { presence: true, numericality: { onlyInteger: true } },
  qty: { presence: true, numericality: { onlyInteger: true } },
  note: { presence: false },
  address_id: { presence: true, numericality: { onlyInteger: true } },
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

constraints.bulkUpdate = {
  id: { presence: true, numericality: { onlyInteger: true } },
  expedition_id: { presence: false, numericality: { onlyInteger: true } },
  expedition_service_id: { presence: false, numericality: { onlyInteger: true } },
  qty: { presence: false, numericality: { onlyInteger: true } },
  note: { presence: false },
  address_id: { presence: false, numericality: { onlyInteger: true } },
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
