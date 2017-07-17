const constraints = {};

constraints.create = {
  store: { presence: true },
  'store.name': { presence: true },
  'store.slogan': { presence: true },
  'store.description': { presence: true },
  expedition_services: { presence: true },
  user: { presence: true },
  address: { presence: true },
  'address.province_id': { presence: true },
  'address.district_id': { presence: true },
  'address.sub_district_id': { presence: true },
  'address.village_id': { presence: true },
  'address.postal_code': {
    presence: true,
    length: { is: 5 },
  },
  'address.email': { presence: true },
  'address.address': {
    presence: true,
    length: { maximum: 200 },
  },
};

constraints.createMessage = {
  subject: { presence: true },
  content: { presence: true },
};

constraints.catalog = {
  name: { presence: true },
};

export default constraints;
