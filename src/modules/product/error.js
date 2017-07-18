import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getProductMsg: {
    title: 'Ambil barang gagal',
    not_found: 'Barang tidak ditemukan',
  },
  createProduct: {
    title: 'Daftar produk gagal',
    catalog_not_found: 'Katalog tidak ditemukan',
  },
};

export const getProductError = formatError.bind(errMsg.getProductMsg);

export const createProductError = formatError.bind(errMsg.createProduct);
