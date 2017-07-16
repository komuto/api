import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getProductMsg: {
    title: 'Ambil barang gagal',
    not_found: 'Barang tidak ditemukan',
  },
};

export const getProductError = formatError.bind(errMsg.getProductMsg);
