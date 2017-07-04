const Message = {
  loginMsg: {
    wrong_password: { password: 'Password salah' },
    title: 'Login gagal',
  },
  registrationMsg: {
    title: 'Registrasi gagal',
  },
  activateMsg: {
    title: 'Aktivasi gagal',
  },
  resetPassMsg: {
    title: 'Reset Password gagal',
  },
  updateMsg: {
    title: 'Update user gagal',
  },
  emailMsg: {
    not_valid: { email: 'Email tidak valid' },
    not_found: { email: 'Email tidak terdaftar' },
    duplicate: { email: 'Email sudah terdaftar' },
    not_available: { email: 'Email sudah terdaftar' },
    presence: 'harus diisi',
  },
  userMsg: {
    not_found: { token: 'User tidak terdaftar' },
  },
  genderMsg: {
    not_valid: { gender: 'Jenis kelamin tidak valid' },
    presence: 'harus diisi',
  },
  tokenMsg: {
    not_valid: { token: 'Token tidak valid' },
    presence: 'harus diisi',
  },
  fbMsg: {
    session_expired: { session: 'Sesi user atau access token telah expired' },
    api_down: { fb: 'Tidak bisa mengakses facebook api' },
    permission_denied: { permission: 'Belum diberikan permisi seperlunya untuk bisa mengakses' },
  },
  passwordMsg: {
    presence: 'harus diisi',
  },
  nameMsg: {
    presence: 'harus diisi',
  },
  phoneNumberMsg: {
    presence: 'harus diisi',
  },
  providerNameMsg: {
    presence: 'harus diisi',
  },
  uidMsg: {
    presence: 'harus diisi',
  },
};

export default Message;
