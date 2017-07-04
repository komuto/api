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
  },
  userMsg: {
    not_found: { token: 'User tidak terdaftar' },
  },
  genderMsg: {
    not_valid: { gender: 'Jenis kelamin tidak valid' },
  },
  tokenMsg: {
    not_valid: { token: 'Token tidak valid' },
  },
};

export default Message;
