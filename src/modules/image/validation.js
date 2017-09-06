const constraints = {};

constraints.upload = {
  images: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['store', 'product', 'payment', 'profile', 'resolution'],
      message: 'accept only `store`, `product`, `payment`, `profile`, or `resolution` value',
    },
  },
};

export default constraints;
