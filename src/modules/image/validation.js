const constraints = {};

constraints.upload = {
  images: {
    presence: true,
  },
  type: {
    presence: true,
    inclusion: {
      within: ['store', 'product', 'payment', 'profile', 'resolution', 'dispute'],
      message: 'accept only `store`, `product`, `payment`, `profile`, `resolution`, or `dispute` value',
    },
  },
};

export default constraints;
