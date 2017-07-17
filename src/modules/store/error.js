import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  makeFavoriteMsg: {
    title: 'Favoritkan toko gagal',
    repeat_favorite: 'Anda telah memfavoritkan toko ini',
  },
  deleteCatalogMsg: {
    title: 'Hapus katalog gagal',
    not_found: 'Katalog tidak ditemukan',
    has_product: 'Katalog tidak bisa dihapus karena masih ada barang didalamnya',
  },
};

export const makeFavoriteError = formatError.bind(errMsg.makeFavoriteMsg);

export const deleteCatalogError = formatError.bind(errMsg.deleteCatalogMsg);
