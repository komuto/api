import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  makeFavoriteMsg: {
    title: 'Favoritkan toko gagal',
    repeat_favorite: 'Anda telah memfavoritkan toko ini',
  },
};

export const makeFavoriteError = formatError.bind(errMsg.makeFavoriteMsg);
