import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getBucket: {
    title: 'Get keranjang gagal',
    not_found: 'Keranjang tidak ditemukan',
  },
  createItem: {
    title: 'Create item gagal',
    error: 'Gagal menambah item',
  },
  getPromo: {
    title: 'Get promo gagal',
    not_found: 'Promo tidak ditemukan',
  },
  invalidPromo: {
    title: 'Invalid promo',
    error: 'Code promo sudah tidak valid',
  },
  createShipping: {
    title: 'Create shipping gagal',
    error: 'Gagal menambah shipping',
  },
};

export const getBucketError = formatError.bind(errMsg.getBucket);

export const createItemError = formatError.bind(errMsg.createItem);

export const getPromoError = formatError.bind(errMsg.getPromo);

export const invalidPromoError = formatError.bind(errMsg.invalidPromo);

export const createShippingError = formatError.bind(errMsg.createShipping);
