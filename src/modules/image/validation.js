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

export default constraints;
