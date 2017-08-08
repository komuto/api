import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getInvoice: {
    title: 'Get invoice gagal',
    not_found: 'Invoice tidak ditemukan',
  },
  getPayment: {
    title: 'Get payment gagal',
    not_found: 'Peyment method tidak ditemukan',
  },
  createInvoice: {
    title: 'Create invoice gagal',
    error: 'Error create invoice',
  },
  createPaymentConfirmation: {
    title: 'Create informasi pembayaran gagal',
    error: 'Error create informasi pembayaran',
  },
  getPaymentConfirmation: {
    title: 'Get informasi pembayaran gagal',
    duplicate: 'Duplicate informasi pembayaran',
  },
};

export const getInvoiceError = formatError.bind(errMsg.getInvoice);

export const createInvoiceError = formatError.bind(errMsg.createInvoice);

export const getPaymentError = formatError.bind(errMsg.getPayment);

export const createPaymentConfirmationError = formatError.bind(errMsg.createPaymentConfirmation);

export const getPaymentConfirmationError = formatError.bind(errMsg.getPaymentConfirmation);

