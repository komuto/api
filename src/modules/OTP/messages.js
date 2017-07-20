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
  verifyOTPAddress: {
    title: 'Verifikasi address gagal',
    not_found: 'Kode tidak ditemukan atau expired',
  },
};

export const createOTPError = formatError.bind(errMsg.OTPMsg);

export const verifyOTPError = formatError.bind(errMsg.verifyOTPMsg);

export const verifyOTPAddressError = formatError.bind(errMsg.verifyOTPAddress);
