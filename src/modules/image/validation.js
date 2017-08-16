const constraints = {};

constraints.upload = {
  images: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['store', 'product', 'payment', 'profile'],
      message: 'accept only `store`, `product`, `payment`, or `profile` value',
    },
  },
};

export default constraints;
