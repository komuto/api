const Message = {
  loginMsg: {
    wrong_password: 'Password salah',
    title: 'Login gagal',
  },
  registrationMsg: {
    title: 'Registrasi gagal',
  },
  activateMsg: {
    title: 'Aktivasi gagal',
  },
  resetPassMsg: {
    title: 'Update password gagal',
  },
  updateMsg: {
    title: 'Update user gagal',
    not_valid: 'Update request field tidak valid',
  },
  emailMsg: {
    not_valid: 'Email tidak valid',
    not_found: 'Email tidak terdaftar',
    duplicate: 'Email sudah terdaftar',
    not_available: 'Email sudah terdaftar',
    presence: 'harus diisi',
  },
  userMsg: {
    not_found: 'User tidak terdaftar',
  },
  genderMsg: {
    not_valid: 'Jenis kelamin tidak valid',
    presence: 'harus diisi',
  },
  tokenMsg: {
    not_valid: 'Token tidak valid',
    presence: 'harus diisi',
  },
  fbMsg: {
    session_expired: 'Sesi user atau access token telah expired',
    api_down: 'Tidak bisa mengakses facebook api',
    permission_denied: 'Belum diberikan permisi seperlunya untuk bisa mengakses',
  },
  passwordMsg: {
    presence: 'harus diisi',
    not_match: 'Password lama salah',
  },
  nameMsg: {
    presence: 'harus diisi',
  },
  phoneNumberMsg: {
    presence: 'harus diisi',
    not_valid: 'harus angka',
    not_available: 'Belum punya no hp',
  },
  providerNameMsg: {
    presence: 'harus diisi',
  },
  uidMsg: {
    presence: 'harus diisi',
  },
  apprCoopMsg: {
    not_valid: 'Approval cooperative status tidak valid',
  },
  statusMsg: {
    not_valid: 'Status tidak valid',
  },
  birthMsg: {
    place_not_valid: 'Tempat lahir bukan kode wilayah valid',
  },
  OTPMsg: {
    title: 'Kirim OTP gagal',
    titleVerify: 'Verifikasi hp gagal',
    presence: 'harus diisi',
    not_valid: 'tidak valid',
    not_found: 'Kode tidak ditemukan atau expired atau sudah terpakai',
  },
};

export default Message;
