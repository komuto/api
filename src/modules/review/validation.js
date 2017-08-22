const constraints = {};

constraints.createReview = {
  review: { presence: true },
  quality: { presence: true, numericality: true },
  accuracy: { presence: true, numericality: true },
};

export default constraints;
