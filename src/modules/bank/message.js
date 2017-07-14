const Message = {
  createMsg: {
    title: 'Buat rekening gagal',
    not_found: 'Barang tidak ditemukan',
    duplicate_account: 'No rekening sudah dibuat',
  },
  updateMsg: {
    title: 'Update rekening gagal',
    not_found: 'Rekening tidak ditemukan',
  },
  getAccountMsg: {
    title: 'Lihat rekening gagal',
    not_found: 'Rekening tidak ditemukan',
  },
  masterBankMsg: {
    presence: 'harus diisi',
  },
  holderNameMsg: {
    presence: 'harus diisi',
  },
  holderAccountMsg: {
    presence: 'harus diisi',
    not_valid: 'harus angka',
  },
  bankBranchMsg: {
    presence: 'harus diisi',
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
