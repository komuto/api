import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getProduct: {
    title: 'Get barang gagal',
    not_found: 'Barang tidak ditemukan',
    error: 'Error get barang',
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
    owner: 'Anda tidak bisa menambah diskusi ke produk Anda',
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
  updateProduct: {
    title: 'Gagal mengubah produk',
    error: 'Tidak bisa mengubah produk',
  },
  getCatalogProducts: {
    title: 'Get catalog products gagal',
    not_found: 'Katalog tidak ditemukan',
  },
  addDropshipProduct: {
    title: 'Gagal menambah product dropship',
    own_product: 'Tidak bisa menambah produk sendiri',
    catalog_not_found: 'Katalog tidak ditemukan',
    product_not_dropship: 'Produk tidak bisa dijadikan dropship',
    duplicate: 'Produk sudah ada di daftar dropship',
  },
  getDropshipProduct: {
    title: 'Get produk dropship gagal',
    not_found: 'Produk tidak ditemukan',
  },
  deleteDropshipProduct: {
    title: 'Hapus produk dropship gagal',
    error: 'Produk gagak dihapus',
  },
  getFee: {
    title: 'Get master fee gagal',
    not_found: 'Fee tidak ditemukan',
  },
};

export const getProductError = formatError.bind(errMsg.getProduct);

export const createProductError = formatError.bind(errMsg.createProduct);

export const getDiscussionError = formatError.bind(errMsg.getDiscussion);

export const createDiscussionError = formatError.bind(errMsg.createDiscussion);

export const createDropshipError = formatError.bind(errMsg.createDropship);

export const createReportError = formatError.bind(errMsg.createReport);

export const getCatalogProductsError = formatError.bind(errMsg.getCatalogProducts);

export const updateProductError = formatError.bind(errMsg.updateProduct);

export const addDropshipProductError = formatError.bind(errMsg.addDropshipProduct);

export const getDropshipProductError = formatError.bind(errMsg.getDropshipProduct);

export const deleteDropshipProductError = formatError.bind(errMsg.deleteDropshipProduct);

export const getFeeError = formatError.bind(errMsg.getFee);
