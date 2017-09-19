import moment from 'moment';
import randomInt from 'random-int';
import core from '../../core';
import { getInvoiceError, createInvoiceError } from './../messages';
import { Store } from '../../store/model/store';
import config from '../../../../config';

const { parseDate, parseNum, matchDB } = core.utils;
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
  COMPLAINT_DONE: 6,
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

  serialize({ minimal = false, orderDetail = false } = {}) {
    const invoice = {
      id: this.get('id_invoice'),
      payment_method_id: this.get('id_paymentmethod'),
      store_id: this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }) : undefined,
      shipping: this.relations.shipping ? this.related('shipping').serialize() : undefined,
      invoice_number: this.get('no_invoice'),
      total_bill: parseNum(this.get('total_tagihan')),
      total_price: parseNum(this.get('total_harga')),
      status: parseNum(this.get('status_invoice')),
      transaction_status: parseNum(this.get('status_transaksi'), null),
      created_at: parseDate(this.get('createdate_invoice')),
    };
    if (orderDetail) {
      const shipping = invoice.shipping;
      invoice.delivery_cost = parseNum(this.get('biaya_ongkir'));
      invoice.insurance_fee = parseNum(this.get('biaya_asuransi'));
      invoice.expedition = shipping.expedition_service;
      invoice.is_insurance = shipping.is_insurance;
      invoice.note = shipping.note;
      invoice.seller_note = shipping.seller_note;
      invoice.confirmed_at = parseDate(this.get('confirmation_date'));
      invoice.shipping = undefined;
      invoice.store = undefined;
    }
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

  item() {
    return this.hasOne('Item', 'id_invoice');
  }

  store() {
    return this.belongsTo('Store', 'id_toko');
  }

  shipping() {
    return this.belongsTo('Shipping', 'id_pengiriman_produk');
  }

  buyer() {
    return this.belongsTo('User', 'id_user');
  }

  dispute() {
    return this.hasOne('Dispute', 'identifierinvoice_dispute');
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
    }).fetch({ withRelated: ['items.product.images', 'store', 'shipping.address'] });

    if (!invoice) throw getInvoiceError('invoice', 'not_found');

    const items = invoice.related('items').map((item) => {
      const product = item.related('product');
      const image = product.related('images').models;
      return {
        ...item.serialize({ note: true }),
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

  /**
   * @param id {int} store id
   * @param invoiceStatus {int}
   * @param page {int}
   * @param pageSize {int}
   */
  static async getOrders(id, invoiceStatus, page, pageSize) {
    let where = { 'invoice.id_toko': id };
    if (invoiceStatus) where = { ...where, status_transaksi: invoiceStatus };
    const invoices = await this.where(where)
      .query((qb) => {
        if (!invoiceStatus) {
          qb.whereNotIn('status_transaksi', [InvoiceTransactionStatus.WAITING, InvoiceTransactionStatus.PROCEED]);
          qb.whereNotNull('status_transaksi');
        }
        qb.join('listbucket as l', 'l.id_invoice', 'invoice.id_invoice')
          .leftJoin('dropshipper as d', 'd.id_dropshipper', 'l.id_dropshipper')
          .orWhere('d.id_toko', id)
          .andWhere('status_transaksi', invoiceStatus);
      })
      .fetchPage({ page, pageSize, withRelated: ['items.product.image', 'buyer'] });
    if (!invoices) return [];
    return invoices.map((invoice) => {
      const products = invoice.related('items').map((item) => {
        const product = item.related('product');
        const image = product.related('image').serialize().file;
        return { ...product.serialize({ minimal: true }), image };
      });
      const dropship = !!invoice.related('items').models[0].get('id_dropshipper');
      const user = invoice.related('buyer').serialize({ orderDetail: true });
      invoice = { ...invoice.serialize({ minimal: true }), is_drophship: dropship };
      return { invoice, products, user };
    });
  }

  /**
   * @param id {int} invoice id
   * @param store {object}
   * @param invoiceStatus {object}
   */
  static async getOrderDetail(id, store, invoiceStatus = null) {
    const storeId = store.get('id_toko');
    let where = { 'invoice.id_invoice': id };
    const related = [
      'items.product.image',
      { 'store.user.address': qb => qb.where('alamat_originjual', 1) },
      'buyer',
      'shipping.address',
      'shipping.expeditionService.expedition',
    ];
    if (invoiceStatus) {
      where = { ...where, status_transaksi: invoiceStatus };
    } else {
      related.push('items.review');
      related.push('dispute');
    }
    const invoice = await this.where({ ...where, 'invoice.id_toko': storeId })
      .query((qb) => {
        if (!invoiceStatus) {
          qb.whereNotIn('status_transaksi', [InvoiceTransactionStatus.WAITING, InvoiceTransactionStatus.PROCEED]);
          qb.whereNotNull('status_transaksi');
        }
        qb.select(['invoice.*', 'd.id_toko as store_dropship_id'])
          .join('listbucket as l', 'l.id_invoice', 'invoice.id_invoice')
          .leftJoin('dropshipper as d', 'd.id_dropshipper', 'l.id_dropshipper')
          .orWhere('d.id_toko', storeId)
          .where(where);
      })
      .fetch({ withRelated: related });
    if (!invoice) return false;
    const storeDropshipId = invoice.get('store_dropship_id');
    const getBuyer = invoice.load('buyer');
    let getStore;
    if (storeDropshipId) {
      // If we are the reseller then use the store in the argument
      getStore = storeDropshipId !== storeId ? Store.where('id_toko', storeDropshipId).fetch() : Promise.resolve(store);
    }
    const getBuyerAddress = invoice.related('shipping').related('address').load(['province', 'district', 'subDistrict', 'village']);
    const seller = invoice.related('store').related('user');
    const getSellerAddress = seller.related('address').load(['province', 'district', 'subDistrict', 'village']);
    const items = invoice.related('items').map((item) => {
      const product = item.related('product');
      const image = product.related('image').serialize().file;
      let review = item.related('review');
      review = review.serialize().id ? review : null;
      item = item.serialize({ minimal: true, note: true });
      item = { ...item, product: { ...product.serialize({ minimal: true }), image } };
      if (!invoiceStatus) {
        item = {
          ...item,
          review: invoice.get('status_transaksi') === InvoiceTransactionStatus.RECEIVED ? review : null,
        };
      }
      return item;
    });
    const [buyerAddress, sellerAddress] = await Promise.all([
      getBuyerAddress,
      getSellerAddress,
      getBuyer,
    ]);
    const buyer = invoice.related('buyer').serialize({ orderDetail: true });
    const result = {
      invoice: invoice.serialize({ minimal: true, orderDetail: true }),
      items,
      buyer: { ...buyer, address: buyerAddress.serialize({ full: true }) },
      seller: {
        ...seller.serialize({ orderDetail: true }),
        address: sellerAddress.serialize({ full: true }),
      },
    };
    if (storeDropshipId) {
      const isReseller = Number(storeDropshipId) === Number(storeId);
      const dropshipStore = await getStore;
      const resellerStore = dropshipStore.serialize({ favorite: true });
      // include reseller logo if we are the original seller
      resellerStore.logo = isReseller ? null : resellerStore.logo;
      result.reseller = { store: resellerStore };
      result.invoice.type = isReseller ? 'reseller' : 'seller';
    } else {
      result.invoice.type = 'buyer';
    }
    if (!invoiceStatus) {
      const shipping = invoice.related('shipping').serialize();
      delete shipping.address;
      delete shipping.expedition_service;
      const dispute = invoice.related('dispute').serialize();
      return {
        ...result,
        shipping,
        dispute: dispute.id ? dispute : null,
      };
    }
    return result;
  }

  static async updateStatus(id, status) {
    const now = moment();
    const data = { status_transaksi: status, updated_at: now };
    if (status === InvoiceTransactionStatus.PROCEED) data.confirmation_date = now;
    return await this.where({ id_invoice: id }).save(data, { patch: true });
  }

  static async getWithDropship(id) {
    return await this.where('id_invoice', id).fetch({ withRelated: ['item.dropship'] });
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
    return matchDB(data, column);
  }
}

export const Invoice = bookshelf.model('Invoice', InvoiceModel);
