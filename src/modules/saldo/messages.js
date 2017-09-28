import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  withdrawMsg: {
    title: 'Tarik saldo gagal',
    not_enough: 'Saldo tidak cukup',
    bank_account_presence: 'Belum memilih rekening',
    bank_account_not_found: 'Rekening tidak ditemukan',
    amount_presence: 'Belum memilih jumlah tarik dana',
    otp_presence: 'Harus ada kode otp',
    otp_not_valid: 'Kode tidak valid',
    otp_not_found: 'Kode otp salah atau expired',
    not_number: 'harus angka',
  },
  transDetail: {
    title: 'Lihat detail transaksi gagal',
    not_found: 'Transaksi tidak ditemukan',
    transaction_corrupted: 'Data transaksi tidak lengkap',
  },
  getHistory: {
    title: 'Get history saldo gagal',
    invalid_date: 'Invalid date',
  },
};

export const withdrawError = formatError.bind(errMsg.withdrawMsg);
export const transDetailError = formatError.bind(errMsg.transDetail);
export const getHistoryError = formatError.bind(errMsg.getHistory);
