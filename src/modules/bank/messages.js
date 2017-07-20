import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  createMsg: {
    title: 'Buat rekening gagal',
    duplicate_account: 'No rekening sudah dibuat',
    not_found: 'Barang tidak ditemukan',
    code_presence: 'Kode harus diisi',
    code_not_valid: 'Kode tidak valid',
    code_not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
    master_bank_presence: 'Master bank harus diisi',
    holder_name_presence: 'Nama pemilik rekening harus diisi',
    account_number_presence: 'Nomor rekening harus diisi',
    account_number_not_valid: 'Nomor rekening harus angka',
    bank_brach_name_presence: 'Nama bank brach harus diisi',
  },
  updateMsg: {
    title: 'Update rekening gagal',
    account_not_found: 'Rekening tidak ditemukan',
    duplicate_account: 'No rekening sudah dibuat',
    code_not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
  },
  getAccountMsg: {
    title: 'Lihat rekening gagal',
    not_found: 'Rekening tidak ditemukan',
  },
  deleteMsg: {
    title: 'Hapus rekening gagal',
    account_not_found: 'Rekening tidak ditemukan',
    code_presence: 'Kode harus diisi',
    code_not_valid: 'Kode tidak valid',
    code_not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
  },
};

export const getAccountError = formatError.bind(errMsg.getAccountMsg);

export const createAccountError = formatError.bind(errMsg.createMsg);

export const updateAccountError = formatError.bind(errMsg.updateMsg);

export const deleteAccountError = formatError.bind(errMsg.deleteMsg);
