import { utils } from '../core';
import { BadRequestError } from '../../../common/errors';

const { formatSingularErr, formatError } = utils;

export const errMsg = {
  loginMsg: {
    title: 'Login gagal',
    wrong_password: 'Password salah',
    bad_request: 'Bad request',
    password_presence: '^Password harus diisi',
    email_presence: '^Email harus diisi',
    email_not_valid: '^Email tidak valid',
    email_not_found: 'Email tidak terdaftar',
    provName_presence: '^Provider name harus diisi',
    uid_presence: '^Provider uid harus diisi',
    token_presence: '^Access token harus diisi',
  },
  registrationMsg: {
    title: 'Registrasi gagal',
    duplicate_email: 'Email sudah terdaftar',
    name_presence: '^Nama harus diisi',
    email_presence: '^Email harus diisi',
    email_not_valid: '^Email tidak valid',
    password_presence: '^Password harus diisi',
    password_length: '^Password minimal 5 karakter',
    gender_presence: '^Jenis kelamin harus diisi',
    gender_not_valid: '^Jenis kelamin tidak valid',
    phone_presence: '^No hp harus diisi',
  },
  activateMsg: {
    title: 'Aktivasi gagal',
    token_not_valid: 'Token tidak valid',
  },
  resetPassMsg: {
    title: 'Update password gagal',
    not_match: 'Password lama salah',
    email_not_found: 'Email tidak terdaftar',
    token_not_valid: 'Token tidak valid',
  },
  updateMsg: {
    title: 'Update user gagal',
    not_valid: 'Update request field tidak valid',
    email_not_valid: '^Email tidak valid',
    app_coop_not_valid: '^Approval cooperative status tidak valid',
    gender_not_valid: '^Jenis kelamin tidak valid',
    status_not_valid: '^Status tidak valid',
    place_not_valid: '^Tempat lahir bukan kode wilayah valid',
    phone_presence: '^No hp harus diisi',
    phone_not_valid: '^No hp harus angka',
  },
  getUserMsg: {
    title: 'Get user gagal',
    not_found: 'User tidak terdaftar',
  },
  fbMsg: {
    session_expired: 'Sesi user atau access token salah atau telah expired',
    api_down: 'Tidak bisa mengakses facebook api',
    permission_denied: 'Belum diberikan permisi seperlunya untuk bisa mengakses',
  },
  OTPMsg: {
    title: 'Kirim OTP gagal',
    titleVerify: 'Verifikasi hp gagal',
    presence: 'harus diisi',
    not_valid: 'tidak valid',
    not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
  },
  getResolution: {
    title: 'Get resolusi gagal',
    not_found: 'Resolusi tidak ditemukan',
  },
  createResolution: {
    title: 'Create resolusi gagal',
    error: 'Gagal membuat resolusi',
  },
};

export const userUpdateError = formatError.bind(errMsg.updateMsg);

export const resetPassError = formatError.bind(errMsg.resetPassMsg);

export const registrationError = formatError.bind(errMsg.registrationMsg);

export const activateUserError = formatError.bind(errMsg.activateMsg);

export const getUserError = formatError.bind(errMsg.getUserMsg);

export const loginError = formatError.bind(errMsg.loginMsg);

export const getResolutionError = formatError.bind(errMsg.getResolution);

export const createResolutionError = formatError.bind(errMsg.createResolution);

function formatFbError(code, e) {
  const session = [102, 190, 458, 459, 460, 463, 464, 467];
  const down = [1, 2, 4, 17, 341, 368];
  if (session.includes(code) || code === 'OAuthException') {
    // session expired error
    return formatSingularErr('access_token', errMsg.fbMsg.session_expired);
  } else if (down.includes(code)) {
    // fb api down error
    return errMsg.fbMsg.api_down;
  } else if (code === 10 || (code >= 200 && code < 300)) {
    // code 10 and 200-299 for not granted permission error
    return formatSingularErr('permission', errMsg.fbMsg.permission_denied);
  }
  // Code outside above range, use original fb message
  return e.message;
}

export const fbError = (error) => {
  const data = formatFbError(error.code ? error.code : error.type, error);
  return new BadRequestError(errMsg.loginMsg.title, data);
};
