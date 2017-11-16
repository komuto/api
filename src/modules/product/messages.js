import { utils } from '../core';

const { formatError } = utils;

export const msg = {
  getProduct: {
    title: 'Get barang gagal',
    not_found: 'Barang tidak ditemukan',
    error: 'Error get barang',
  },
  createProduct: {
    title: 'Daftar produk gagal',
    catalog_not_found: 'Katalog tidak ditemukan',
    unverified_store: 'Toko belum terverifikasi',
    successHide: 'Berhasil menyembunyikan barang',
    successMove: 'Berhasil memindahkan ke katalog lain',
  },
  getDiscussion: {
    title: 'Get diskusi gagal',
    not_found: 'Diskusi tidak ditemukan',
  },
  createDiscussion: {
    title: 'Create diskusi gagal',
    error: 'Gagal menambah diskusi',
    owner: 'Anda tidak bisa menambah diskusi ke produk Anda',
    success: 'Berhasil mengirim diskusi',
    successComment: 'Berhasil menambah komentar diskusi',
  },
  createDropship: {
    title: 'Create dropship gagal',
    error: 'Gagal menambah dropship',
    success: 'Berhasil menjadikan Dropshipping',
  },
  createReport: {
    title: 'Create laporan gagal',
    error: 'Gagal menambah laporan',
  },
  bulkDeleteProduct: {
    title: 'Gagal menghapus produk',
    error: 'Tidak bisa menghapus produk',
    success: 'Berhasil menghapus barang',
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

export const getProductError = formatError.bind(msg.getProduct);

export const createProductError = formatError.bind(msg.createProduct);

export const getDiscussionError = formatError.bind(msg.getDiscussion);

export const createDiscussionError = formatError.bind(msg.createDiscussion);

export const createDropshipError = formatError.bind(msg.createDropship);

export const createReportError = formatError.bind(msg.createReport);

export const getCatalogProductsError = formatError.bind(msg.getCatalogProducts);

export const updateProductError = formatError.bind(msg.updateProduct);

export const addDropshipProductError = formatError.bind(msg.addDropshipProduct);

export const getDropshipProductError = formatError.bind(msg.getDropshipProduct);

export const deleteDropshipProductError = formatError.bind(msg.deleteDropshipProduct);

export const getFeeError = formatError.bind(msg.getFee);
