import { msg } from './messages';

const { createMsg, updateMsg } = msg;
const constraints = {};

constraints.createAddress = {
  province_id: {
    presence: { message: createMsg.province_presence },
    numericality: { noStrings: true, onlyInteger: true, message: createMsg.province_not_valid },
  },
  district_id: {
    presence: { message: createMsg.district_presence },
    numericality: { noStrings: true, onlyInteger: true, message: createMsg.district_not_valid },
  },
  sub_district_id: {
    presence: { message: createMsg.subdistrict_presence },
    numericality: { noStrings: true, onlyInteger: true, message: createMsg.subdistrict_not_valid },
  },
  village_id: {
    presence: { message: createMsg.village_presence },
    numericality: { noStrings: true, onlyInteger: true, message: createMsg.village_not_valid },
  },
  postal_code: {
    presence: { message: createMsg.postal_code_presence },
    format: { pattern: /\d{5}(-\d{4})?/, message: createMsg.postal_code_not_valid },
  },
  name: { presence: { message: createMsg.name_presence } },
  address: { presence: { message: createMsg.address_presence } },
  alias_address: { presence: { message: createMsg.alias_address_presence } },
  is_primary: {
    presence: true,
    inclusion: {
      within: [true, false],
      message: 'accept only `true` or `false` value',
    },
  },
};

constraints.updateAddress = {
  province_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.province_not_valid },
  },
  district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.district_not_valid },
  },
  sub_district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.subdistrict_not_valid },
  },
  village_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.village_not_valid },
  },
  email: {
    format: {
      pattern: /^([a-zA-Z0-9_\.])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
      message: updateMsg.email_not_valid,
    },
  },
  postal_code: {
    format: { pattern: /\d{5}(-\d{4})?/, message: updateMsg.postal_code_not_valid },
  },
  is_primary: {
    inclusion: {
      within: [true, false],
      message: 'accept only `true` or `false` value',
    },
  },
};

constraints.updateStoreAddress = {
  province_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.province_not_valid },
  },
  district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.district_not_valid },
  },
  sub_district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.subdistrict_not_valid },
  },
  village_id: {
    numericality: { noStrings: true, onlyInteger: true, message: updateMsg.village_not_valid },
  },
  postal_code: {
    format: { pattern: /\d{5}(-\d{4})?/, message: updateMsg.postal_code_not_valid },
  },
  address: { presence: false },
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
