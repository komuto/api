import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  OTPMsg: {
    title: 'Kirim OTP gagal',
    presence: 'harus diisi',
    not_valid: 'tidak valid',
    phone_not_available: 'Belum punya no hp',
  },
  verifyOTPMsg: {
    title: 'Verifikasi hp gagal',
    not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
  },
  createBankMsg: {
    title: 'Tambah rekening gagal',
    phone_not_verified: 'Belum punya no hp yg telah terverifikasi',
  },
};

export const createOTPError = formatError.bind(errMsg.OTPMsg);

export const createBankError = formatError.bind(errMsg.createBankMsg);

export const verifyOTPError = formatError.bind(errMsg.verifyOTPMsg);
