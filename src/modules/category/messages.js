import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getCategory: {
    title: 'Get kategori gagal',
    not_found: 'Kategori tidak ditemukan',
  },
};

export const getCategoryError = formatError.bind(errMsg.getCategory);
