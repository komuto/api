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
  createDispute: {
    title: 'Create dispute gagal',
    error: 'Error create dispute',
  },
  createPaymentConfirmation: {
    title: 'Create informasi pembayaran gagal',
    error: 'Error create informasi pembayaran',
  },
  getPaymentConfirmation: {
    title: 'Get informasi pembayaran gagal',
    duplicate: 'Duplicate informasi pembayaran',
  },
  getNominal: {
    title: 'Get nominal gagal',
    not_found: 'Nominal tidak ditemukan',
  },
};

export const getInvoiceError = formatError.bind(errMsg.getInvoice);

export const createInvoiceError = formatError.bind(errMsg.createInvoice);

export const createDisputeError = formatError.bind(errMsg.createDispute);

export const getPaymentError = formatError.bind(errMsg.getPayment);

export const createPaymentConfirmationError = formatError.bind(errMsg.createPaymentConfirmation);

export const getPaymentConfirmationError = formatError.bind(errMsg.getPaymentConfirmation);

export const getNominalError = formatError.bind(errMsg.getNominal);

