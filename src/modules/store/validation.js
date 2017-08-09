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
  'address.address': {
    presence: true,
    length: { maximum: 200 },
  },
};

constraints.update = {
  name: { presence: true },
  slogan: { presence: true },
  description: { presence: true },
  logo: { presence: false },
};

constraints.update_term = { term_condition: { presence: true } };

constraints.create_message = {
  subject: { presence: true },
  content: { presence: true },
};

constraints.catalog = { name: { presence: true } };

constraints.verify = { code: { presence: true } };

export default constraints;
