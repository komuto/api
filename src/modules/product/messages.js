import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getProduct: {
    title: 'Get barang gagal',
    not_found: 'Barang tidak ditemukan',
  },
  createProduct: {
    title: 'Daftar produk gagal',
    catalog_not_found: 'Katalog tidak ditemukan',
  },
  getDiscussion: {
    title: 'Get diskusi gagal',
    not_found: 'Diskusi tidak ditemukan',
  },
  createDiscussion: {
    title: 'Create diskusi gagal',
    error: 'Gagal menambah diskusi',
  },
  createDropship: {
    title: 'Create dropship gagal',
    error: 'Gagal menambah dropship',
  },
  createReport: {
    title: 'Create laporan gagal',
    error: 'Gagal menambah laporan',
  },
  bulkDeleteProduct: {
    title: 'Gagal menghapus produk',
    error: 'Tidak bisa menghapus produk',
  },
};

export const getProductError = formatError.bind(errMsg.getProduct);

export const createProductError = formatError.bind(errMsg.createProduct);

export const getDiscussionError = formatError.bind(errMsg.getDiscussion);

export const createDiscussionError = formatError.bind(errMsg.createDiscussion);

export const createDropshipError = formatError.bind(errMsg.createDropship);

export const createReportError = formatError.bind(errMsg.createReport);
