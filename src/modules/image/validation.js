const constraints = {};

constraints.upload = {
  images: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['store', 'product', 'payment'],
      message: 'accept only `store` or `product` value',
    },
  },
};

export default constraints;
