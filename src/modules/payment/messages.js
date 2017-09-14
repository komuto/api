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
  getDispute: {
    title: 'Get komplain gagal',
    not_found: 'Komplain tidak ditemukan',
  },
  acceptOrder: {
    title: 'Terima order gagal',
    not_found: 'Order tidak ditemukan',
  },
  rejectOrder: {
    title: 'Tolak order gagal',
    not_found: 'Order tidak ditemukan',
  },
  inputBill: {
    title: 'Input resi gagal',
    not_found: 'Order tidak ditemukan',
    error: 'Input resi gagal',
  },
};

export const getInvoiceError = formatError.bind(errMsg.getInvoice);
export const createInvoiceError = formatError.bind(errMsg.createInvoice);
export const createDisputeError = formatError.bind(errMsg.createDispute);
export const getDisputeError = formatError.bind(errMsg.getDispute);
export const getPaymentError = formatError.bind(errMsg.getPayment);
export const createPaymentConfirmationError = formatError.bind(errMsg.createPaymentConfirmation);
export const getPaymentConfirmationError = formatError.bind(errMsg.getPaymentConfirmation);
export const getNominalError = formatError.bind(errMsg.getNominal);
export const acceptOrderError = formatError.bind(errMsg.acceptOrder);
export const rejectOrderError = formatError.bind(errMsg.rejectOrder);
export const inputBillError = formatError.bind(errMsg.inputBill);
