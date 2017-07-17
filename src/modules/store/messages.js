import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  create: {
    title: 'Create katalog gagal',
    duplicate: 'Katalog sudah ada',
    error: 'Error saat membuat katalog',
  },
  get: {
    title: 'Catalog tidak ditemukan',
    not_found: 'Katalog tidak ditemukan',
    error: 'Error saat mencari katalog',
  },
  update: {
    title: 'Update katalog gagal',
    error: 'Gagal memperbarui katalog',
    duplicate: 'Katalog sudah ada',
  },
};

export const createCatalogError = formatError.bind(errMsg.create);

export const getCatalogError = formatError.bind(errMsg.get);

export const updateCatalogError = formatError.bind(errMsg.update);
