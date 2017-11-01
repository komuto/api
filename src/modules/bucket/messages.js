import { utils } from '../core';

const { formatError } = utils;

export const errMsg = {
  getBucket: {
    title: 'Get keranjang gagal',
    not_found: 'Keranjang tidak ditemukan',
    not_found_items: 'Tidak menemukan items',
    stock: 'Permintaan barang melebihi stok barang',
  },
  getTransaction: {
    title: 'Get transaksi gagal',
    not_found: 'Transaksi tidak ditemukan',
  },
  getItem: {
    title: 'Get item gagal',
    not_found: 'Item tidak ditemukan',
  },
  addPromo: {
    title: 'Gunakan promo gagal',
    not_enough: 'Total belanja tidak mencapai minimal promo',
    not_found: 'Promo tidak ditemukan atau sudah tidak valid',
    used: 'Promo sudah terpakai',
  },
  createShipping: {
    title: 'Create shipping gagal',
    error: 'Gagal menambah shipping',
  },
  updateShipping: {
    title: 'Update shipping gagal',
    error: 'Gagal mengubah shipping',
  },
  addCart: {
    title: 'Tambah barang gagal',
    stock: 'Stok tidak tersedia',
    address_not_found: 'Alamat tidak ditemukan',
    not_valid: 'Tidak bisa membeli barang sendiri',
  },
  balancePayment: {
    title: 'Gagal membayar dengan balance',
    not_enough: 'Balance tidak mencukupi',
    not_found: 'Transaksi tidak ditemukan',
  },
};

export const getBucketError = formatError.bind(errMsg.getBucket);
export const getTransactionError = formatError.bind(errMsg.getTransaction);
export const getItemError = formatError.bind(errMsg.getItem);
export const addPromoError = formatError.bind(errMsg.addPromo);
export const createShippingError = formatError.bind(errMsg.createShipping);
export const updateShippingError = formatError.bind(errMsg.updateShipping);
export const addCartError = formatError.bind(errMsg.addCart);
export const paymentError = formatError.bind(errMsg.balancePayment);
