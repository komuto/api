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
  nameMsg: {
    presence: { name: 'Nama harus diisi' },
  },
  emailMsg: {
    not_valid: { email: 'Email tidak valid' },
    not_found: { email: 'Email tidak terdaftar' },
    duplicate: { email: 'Email sudah terdaftar' },
    not_available: { email: 'Email sudah terdaftar' },
    presence: 'harus diisi',
  },
  provinceMsg: {
    not_number: { province_id: 'Province id harus integer' },
    presence: 'harus diisi',
  },
  districtMsg: {
    not_number: { district_id: 'District id harus integer' },
    presence: 'harus diisi',
  },
  subDistrictMsg: {
    not_number: { sub_district_id: 'Subdistrict id harus integer' },
    presence: 'harus diisi',
  },
  villageMsg: {
    not_number: { village_id: 'Village id harus integer' },
    presence: 'harus diisi',
  },
  postalCodeMsg: {
    not_valid: { postal_code: 'Kode pos tidak valid' },
    presence: 'harus diisi',
  },
  addressMsg: {
    primary_duplicate: { address: 'Alamat primary sudah ada' },
    not_found: { address: 'Alamat tidak ditemukan' },
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
