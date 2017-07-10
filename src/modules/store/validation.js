const constraints = {};

constraints.create = {
  store: {
    presence: true,
  },
  'store.name': {
    presence: true,
  },
  'store.slogan': {
    presence: true,
  },
  'store.description': {
    presence: true,
  },
  expedition_services: {
    presence: true,
  },
  user: {
    presence: true,
  },
  address: {
    presence: true,
  },
};

export default constraints;
