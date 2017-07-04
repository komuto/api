import { emailMsg, postalCodeMsg, provinceMsg, districtMsg, subDistrictMsg, villageMsg, aliasAddressMsg, addressMsg, isPrimaryMsg, nameMsg } from './message';

const constraints = {};

constraints.createAddress = {
  province_id: {
    presence: { message: provinceMsg.presence },
    numericality: { noStrings: true, onlyInteger: true, message: provinceMsg.not_number },
  },
  district_id: {
    presence: { message: districtMsg.presence },
    numericality: { noStrings: true, onlyInteger: true, message: districtMsg.not_number },
  },
  sub_district_id: {
    presence: { message: subDistrictMsg.presence },
    numericality: { noStrings: true, onlyInteger: true, message: subDistrictMsg.not_number },
  },
  village_id: {
    presence: { message: villageMsg.presence },
    numericality: { noStrings: true, onlyInteger: true, message: villageMsg.not_number },
  },
  email: {
    presence: { message: emailMsg.presence },
    email: { message: emailMsg.not_valid },
  },
  postal_code: {
    presence: { message: postalCodeMsg.presence },
    format: { pattern: /\d{5}(-\d{4})?/, message: postalCodeMsg.not_valid },
  },
  name: { presence: { message: nameMsg.presence } },
  address: { presence: { message: addressMsg.presence } },
  alias_address: { presence: { message: aliasAddressMsg.presence } },
  is_primary: { presence: { message: isPrimaryMsg.presence } },
};

constraints.updateAddress = {
  province_id: {
    numericality: { noStrings: true, onlyInteger: true, message: provinceMsg.not_number },
  },
  district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: districtMsg.not_number },
  },
  sub_district_id: {
    numericality: { noStrings: true, onlyInteger: true, message: subDistrictMsg.not_number },
  },
  village_id: {
    numericality: { noStrings: true, onlyInteger: true, message: villageMsg.not_number },
  },
  email: {
    email: { message: emailMsg.not_valid },
  },
  postal_code: {
    format: { pattern: /\d{5}(-\d{4})?/, message: postalCodeMsg.not_valid },
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
