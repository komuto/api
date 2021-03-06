import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getReview: {
    title: 'Get review gagal',
    not_found: 'Review tidak ditemukan',
  },
  createReview: {
    title: 'Create review gagal',
    duplicate: 'You have already submitted your review for this product',
    product_not_found: 'Anda belum membeli produk ini',
    error: 'Gagal menambah review',
    disable: 'Anda tidak bisa menambah review',
  },
};

export const createReviewError = formatError.bind(errMsg.createReview);
