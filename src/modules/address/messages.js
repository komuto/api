import { utils } from '../core';

const { formatError } = utils;

export const msg = {
  getMsg: {
    title: 'Address tidak ditemukan',
    not_found: 'Alamat tidak ditemukan',
  },
  createMsg: {
    title: 'Daftar address gagal',
    province_presence: '^Provinsi harus diisi',
    province_not_valid: '^Provinsi harus angka',
    district_presence: '^Kabupaten harus diisi',
    district_not_valid: '^Kabupaten harus angka',
    subdistrict_presence: '^Kecamatan harus diisi',
    subdistrict_not_valid: '^Kecamatan harus angka',
    village_presence: '^Kelurahan harus diisi',
    village_not_valid: '^Kelurahan harus angka',
    postal_code_presence: '^Kode pos harus diisi',
    postal_code_not_valid: '^Kode pos tidak valid',
    name_presence: '^Nama penerima harus diisi',
    address_presence: '^Alamat harus diisi',
    alias_address_presence: '^Alamat alias harus diisi',
    success: 'Sukses menambahkan alamat baru',
  },
  updateMsg: {
    title: 'Update address gagal',
    province_not_valid: '^Provinsi harus angka',
    district_not_valid: '^Kabupaten harus angka',
    subdistrict_not_valid: '^Kecamatan harus angka',
    village_not_valid: '^Kelurahan harus angka',
    email_not_valid: '^Email tidak valid',
    postal_code_not_valid: '^Kode pos tidak valid',
    success: 'Sukses mengubah info alamat',
  },
  deleteMsg: {
    title: 'Delete address gagal',
    address_not_found: 'Alamat tidak ditemukan',
    success: 'Sukses menghapus alamat',
  },
};

export const getAddressError = formatError.bind(msg.getMsg);

export const deleteAddressError = formatError.bind(msg.deleteMsg);
