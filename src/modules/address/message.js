const Message = {
  getMsg: {
    title: 'Address tidak ditemukan',
  },
  createMsg: {
    title: 'Daftar address gagal',
  },
  updateMsg: {
    title: 'Update address gagal',
  },
  deleteMsg: {
    title: 'Delete address gagal',
    not_valid: 'Alamat tidak ditemukan',
  },
  nameMsg: {
    presence: 'Nama harus diisi',
  },
  emailMsg: {
    not_valid: 'Email tidak valid',
    not_found: 'Email tidak terdaftar',
    duplicate: 'Email sudah terdaftar',
    not_available: 'Email sudah terdaftar',
    presence: 'harus diisi',
  },
  provinceMsg: {
    not_number: 'Province id harus integer',
    presence: 'harus diisi',
  },
  districtMsg: {
    not_number: 'District id harus integer',
    presence: 'harus diisi',
  },
  subDistrictMsg: {
    not_number: 'Subdistrict id harus integer',
    presence: 'harus diisi',
  },
  villageMsg: {
    not_number: 'Village id harus integer',
    presence: 'harus diisi',
  },
  postalCodeMsg: {
    not_valid: 'Kode pos tidak valid',
    presence: 'harus diisi',
  },
  addressMsg: {
    primary_duplicate: 'Alamat primary sudah ada',
    not_found: 'Alamat tidak ditemukan',
    presence: 'harus diisi',
  },
  aliasAddressMsg: {
    presence: 'harus diisi',
  },
  isPrimaryMsg: {
    presence: 'harus di check',
  },
};

export default Message;
