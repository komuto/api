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
    error: 'Gagal menambah review',
  },
};

export const getReviewError = formatError.bind(errMsg.getReview);

export const createReviewError = formatError.bind(errMsg.createReview);
