import { utils } from '../core';

const { formatError } = utils;

export const msg = {
  createCatalog: {
    title: 'Create katalog gagal',
    duplicate: 'Katalog sudah ada',
    error: 'Error saat membuat katalog',
  },
  getCatalog: {
    title: 'Catalog tidak ditemukan',
    not_found: 'Katalog tidak ditemukan',
    error: 'Error saat mencari katalog',
  },
  updateCatalog: {
    title: 'Update katalog gagal',
    error: 'Gagal memperbarui katalog',
    duplicate: 'Katalog sudah ada',
  },
  createStore: {
    title: 'Create toko gagal',
    duplicate: 'Toko sudah ada',
  },
  updateStore: {
    logo: 'Format logo salah',
  },
  getStore: {
    title: 'Get toko gagal',
    not_found: 'Toko tidak ditemukan',
  },
  createComment: {
    title: 'Create komentar gagal',
    error: 'Gagal membuat komentar',
  },
  createMessage: {
    title: 'Create pesan gagal',
    error: 'Gagal membuat pesan',
    invoice_not_found: 'Invoice tidak ditemukan',
    own_store: 'Anda tidak bisa mengirim pesan ke toko anda',
  },
  getMessage: {
    title: 'Get pesan gagal',
    not_found: 'Pesan tidak ditemukan',
  },
  makeFavoriteMsg: {
    title: 'Favoritkan toko gagal',
    repeat_favorite: 'Anda telah memfavoritkan toko ini',
    not_valid: 'Tidak bisa memfavoritkan toko sendiri',
    not_found: 'Toko tidak ditemukan',
    success: 'Berhasil memfavoritkan toko',
  },
  deleteCatalogMsg: {
    title: 'Hapus katalog gagal',
    not_found: 'Katalog tidak ditemukan',
    has_product: 'Katalog tidak bisa dihapus karena masih ada barang didalamnya',
  },
};

export const createCatalogError = formatError.bind(msg.createCatalog);

export const getCatalogError = formatError.bind(msg.getCatalog);

export const updateCatalogError = formatError.bind(msg.updateCatalog);

export const createStoreError = formatError.bind(msg.createStore);

export const getStoreError = formatError.bind(msg.getStore);

export const createCommentError = formatError.bind(msg.createComment);

export const createMessageError = formatError.bind(msg.createMessage);

export const getMessageError = formatError.bind(msg.getMessage);

export const makeFavoriteError = formatError.bind(msg.makeFavoriteMsg);

export const deleteCatalogError = formatError.bind(msg.deleteCatalogMsg);
