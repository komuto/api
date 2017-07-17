import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  create: {
    title: 'Create katalog gagal',
    duplicate: 'Katalog sudah ada',
    error: 'Error saat membuat katalog',
  },
};

export const createCatalogError = formatError.bind(errMsg.create);
