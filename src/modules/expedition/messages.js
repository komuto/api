import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getExpedition: {
    title: 'Get ekspedisi gagal',
    not_found: 'Ekspedisi tidak ditemukan',
  },
};

export const getExpeditionError = formatError.bind(errMsg.getExpedition);
