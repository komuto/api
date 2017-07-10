const constraints = {};

constraints.single = {
  image: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['store'],
      message: 'accept only `store` value',
    },
  },
};

constraints.multi = {
  images: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['product'],
      message: 'accept only `product` value',
    },
  },
};

export default constraints;
