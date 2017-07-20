import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getReview: {
    title: 'Get review gagal',
    not_found: 'Review tidak ditemukan',
  },
  createReview: {
    title: 'Create review gagal',
    error: 'You have already submitted your review for this product',
  },
};

export const getReviewError = formatError.bind(errMsg.getReview);

export const createReviewError = formatError.bind(errMsg.createReview);
