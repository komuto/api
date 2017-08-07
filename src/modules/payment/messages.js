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
};

export const getInvoiceError = formatError.bind(errMsg.getInvoice);

export const createInvoiceError = formatError.bind(errMsg.createInvoice);

export const getPaymentError = formatError.bind(errMsg.getPayment);

