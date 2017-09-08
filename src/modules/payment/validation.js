const constraints = {};

constraints.bank = {
  bank_account_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  date: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  amount: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  bank: { presence: true },
  holder_account_number: { presence: true },
  attachment: { presence: true },
};

constraints.bulkReview = {
  product_id: {
    presence: true,
    numericality: { onlyInteger: true },
  },
  review: { presence: true },
  quality: { presence: true, numericality: true },
  accuracy: { presence: true, numericality: true },
};

export default constraints;
