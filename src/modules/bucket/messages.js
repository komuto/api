import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getBucket: {
    title: 'Get keranjang gagal',
    not_found: 'Keranjang tidak ditemukan',
  },
  getPromo: {
    title: 'Get promo gagal',
    not_found: 'Promo tidak ditemukan atau sudah tidak valid',
  },
  createShipping: {
    title: 'Create shipping gagal',
    error: 'Gagal menambah shipping',
  },
  updateShipping: {
    title: 'Update shipping gagal',
    error: 'Gagal mengubah shipping',
  },
};

export const getBucketError = formatError.bind(errMsg.getBucket);

export const getPromoError = formatError.bind(errMsg.getPromo);

export const createShippingError = formatError.bind(errMsg.createShipping);

export const updateShippingError = formatError.bind(errMsg.updateShipping);
