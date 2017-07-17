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
};

export const createCatalogError = formatError.bind(errMsg.create);

export const getCatalogError = formatError.bind(errMsg.get);
