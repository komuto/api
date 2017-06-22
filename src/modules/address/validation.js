const constraints = {};

constraints.createAddress = {
  province_id: {
    presence: true,
    numericality: { noStrings: true, onlyInteger: true },
  },
  district_id: {
    presence: true,
    numericality: { noStrings: true, onlyInteger: true },
  },
  sub_district_id: {
    presence: true,
    numericality: { noStrings: true, onlyInteger: true },
  },
  village_id: {
    presence: true,
    numericality: { noStrings: true, onlyInteger: true },
  },
  email: {
    email: { message: 'is not a valid email' },
  },
  phone_number: {
    length: {},
  },
  postal_code: {
    presence: true,
    format: { pattern: /\d{5}(-\d{4})?/, message: 'is not a valid zipcode' },
  },
  address: { presence: true },
  alias_address: { presence: true },
  is_primary: { presence: true },
};

constraints.updateAddress = {
  province_id: {
    numericality: { noStrings: true, onlyInteger: true },
  },
  district_id: {
    numericality: { noStrings: true, onlyInteger: true },
  },
  sub_district_id: {
    numericality: { noStrings: true, onlyInteger: true },
  },
  village_id: {
    numericality: { noStrings: true, onlyInteger: true },
  },
  email: {
    email: { message: 'is not a valid email' },
  },
  phone_number: {
    numericality: { noStrings: true, onlyInteger: true },
  },
  postal_code: {
    format: { pattern: /\d{5}(-\d{4})?/, message: 'is not a valid zipcode' },
  },
};

/**
 * Create order
 */
constraints.createOrder = {
  products: {
    presence: true,
  },
};

/**
 * Apply coupon
 */
constraints.applyCoupon = {
  coupon_code: {
    presence: true,
  },
};

export default constraints;
