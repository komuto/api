import moment from 'moment';
import randomInt from 'random-int';
import core from '../../core';
import { getInvoiceError, createInvoiceError } from './../messages';
import config from '../../../../config';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;

export const InvoiceStatus = {
  UNPAID: 0,
  PAID: 1,
  FAILED: 2,
};

export const InvoiceTransactionStatus = {
  REJECTED: 0,
  WAITING: 1,
  PROCEED: 2,
  SENDING: 3,
  RECEIVED: 4,
  PROBLEM: 5,
  COMPLAINT: 6,
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}) {
    const invoice = {
      id: this.get('id_invoice'),
      payment_method_id: this.get('id_paymentmethod'),
      store_id: this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }) : undefined,
      shipping: this.relations.shipping ? this.related('shipping') : undefined,
      invoice_number: this.get('no_invoice'),
      total_bill: parseNum(this.get('total_tagihan')),
      total_price: parseNum(this.get('total_harga')),
      status: parseNum(this.get('status_invoice')),
      transaction_status: parseNum(this.get('status_transaksi'), null),
      created_at: parseDate(this.get('createdate_invoice')),
    };
    if (minimal) return invoice;
    return {
      ...invoice,
      user_id: parseNum(this.get('id_user')),
      bucket_id: parseNum(this.get('id_bucket')),
      bid_id: this.get('id_bidlelang'),
      shipping_id: parseNum(this.get('id_pengiriman_produk')),
      remark_cancel: this.get('remark_pembatalan'),
      delivery_cost: parseNum(this.get('biaya_ongkir')),
      insurance_fee: parseNum(this.get('biaya_asuransi')),
      admin_cost: parseNum(this.get('biaya_admin')),
      wallet: parseNum(this.get('bayar_wallet')),
      promo: parseNum(this.get('promo')),
      confirmed_at: parseDate(this.get('confirmation_date')),
      updated_at: parseDate(this.get('updated_at')),
    };
  }

  items() {
    return this.hasMany('Item', 'id_invoice');
  }

  store() {
    return this.belongsTo('Store', 'id_toko');
  }

  shipping() {
    return this.belongsTo('Shipping', 'id_pengiriman_produk');
  }

  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createInvoiceError('invoice', 'error');
    });
  }

  static generateNumber() {
    return `Invoice-${randomInt(1, moment().unix())}/${moment().format('MM')}/${moment().format('Y')}`;
  }

  static async getById(id, userId) {
    const invoice = await this.where({ id_invoice: id, id_user: userId }).fetch();
    if (!invoice) throw getInvoiceError('invoice', 'not_found');
    return invoice;
  }

  static async detail(userId, bucketId, id) {
    const invoice = await this.where({
      id_invoice: id,
      id_user: userId,
      id_bucket: bucketId,
    }).fetch({ withRelated: ['items.product.images', 'store', 'shipping'] });

    if (!invoice) throw getInvoiceError('invoice', 'not_found');

    const items = invoice.related('items').map((item) => {
      const product = item.related('product');
      const image = product.related('images').models;
      return {
        ...item.serialize({ minimal: true }),
        product: {
          ...product.serialize({ minimal: true }),
          image: image.length ? image[0].serialize().file : config.defaultImage.product,
        },
      };
    });

    return { ...invoice.serialize(), items };
  }

  static async get(userId, bucketId, id, withRelated = 'items') {
    withRelated = [withRelated];
    const invoice = await this.where({
      id_invoice: id,
      id_user: userId,
      id_bucket: bucketId,
      status_transaksi: InvoiceTransactionStatus.SENDING,
    }).fetch({ withRelated });
    if (!invoice) throw getInvoiceError('invoice', 'not_found');
    return invoice;
  }

  static async updateStatus(id, status) {
    return await this.where({ id_invoice: id }).save({ status_transaksi: status }, { patch: true });
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
      payment_method_id: 'id_paymentmethod',
      invoice_number: 'no_invoice',
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
      updated_at: 'updated_at',
      transaction_status: 'status_transaksi',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Invoice = bookshelf.model('Invoice', InvoiceModel);
