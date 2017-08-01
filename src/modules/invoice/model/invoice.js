import core from '../../core';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const InvoiceStatus = {
  UNPAID: 0,
  PAID: 1,
  FAILED: 2,
};

class InvoiceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'invoice';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_invoice';
  }

  serialize() {
    return {
      id: this.get('id_invoice'),
      user_id: this.get('id_user'),
      store_id: this.get('id_toko'),
      bucket_id: this.get('id_bucket'),
      bid_id: this.get('id_bidlelang'),
      shipping_id: this.get('id_pengiriman_produk'),
      invoice_number: this.get('no_invoice'),
      payment_method_id: this.get('id_paymentmethod'),
      remark_cancel: this.get('remark_pembatalan'),
      bill: this.get('total_tagihan'),
      total_price: this.get('total_harga'),
      delivery_cost: this.get('biaya_ongkir'),
      insurance_fee: this.get('biaya_asuransi'),
      admin_cost: this.get('biaya_admin'),
      wallet: this.get('bayar_wallet'),
      promo: this.get('promo'),
      status: this.get('status_invoice'),
      created_at: parseDate(this.get('createdate_invoice')),
      confirmed_at: parseDate(this.get('confirmation_date')),
      updated_at: parseDate(this.get('confirmation_date')),
    };
  }

  /**
   * Create shipping
   */
  static async create(data) {
    return await new this(data).save().catch((e) => {
      console.log(e);
      // throw createShippingError('shipping', 'error');
    });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_user',
      store_id: 'id_toko',
      bucket_id: 'id_bucket',
      bid_id: 'id_bidlelang',
      shipping_id: 'id_pengiriman_produk',
      invoice_number: 'no_invoice',
      payment_method_id: 'id_paymentmethod',
      remark_cancel: 'remark_pembatalan',
      bill: 'total_tagihan',
      total_price: 'total_harga',
      delivery_cost: 'biaya_ongkir',
      insurance_fee: 'biaya_asuransi',
      admin_cost: 'biaya_admin',
      wallet: 'bayar_wallet',
      promo: 'promo',
      status: 'status_invoice',
      created_at: 'createdate_invoice',
      confirmed_at: 'confirmation_date',
      updated_at: 'confirmation_date',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Invoice = bookshelf.model('Invoice', InvoiceModel);
export default { Invoice };
