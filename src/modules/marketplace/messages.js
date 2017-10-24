import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  marketplaceMsg: {
    title: 'Gagal get marketplace',
    not_found: 'Marketplace tidak ditemukan',
  },
};

export const getMarketplaceError = formatError.bind(errMsg.marketplaceMsg);
