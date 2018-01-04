import _ from 'lodash';
import moment from 'moment';
import randomInt from 'random-int';
import core from '../../core';
import { getInvoiceError, createInvoiceError } from './../messages';
import { Store } from '../../store/model/store';
import config from '../../../../config';
import { Dropship } from '../../product/model/dropship';
import { DisputeSolutionType, DisputeStatus } from './dispute';
import { Preference } from '../../preference/model';

const { parseDate, parseNum, matchDB, getProductAndStore } = core.utils;
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

  serialize({ minimal = false, orderDetail = false, shippingMin = false } = {}, domain) {
    const invoice = {
      id: this.get('id_invoice'),
      payment_method_id: this.get('id_paymentmethod'),
      store_id: this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }, domain) : undefined,
      shipping: this.relations.shipping ? this.related('shipping').serialize({ minimal: shippingMin }, domain) : undefined,
      invoice_number: this.get('no_invoice'),
      total_bill: parseNum(this.get('total_tagihan')),
      total_price: parseNum(this.get('total_harga')),
      status: parseNum(this.get('status_invoice')),
      transaction_status: this.get('status_transaksi') === 0 ? 0 : parseNum(this.get('status_transaksi'), null),
      created_at: parseDate(this.get('createdate_invoice')),
    };
    if (orderDetail) {
      const shipping = invoice.shipping;
      invoice.delivery_cost = parseNum(this.get('biaya_ongkir'));
      invoice.insurance_fee = parseNum(this.get('biaya_asuransi'));
      if (shipping) {
        invoice.expedition = shipping.expedition_service;
        invoice.is_insurance = shipping.is_insurance;
        invoice.note = shipping.note;
        invoice.seller_note = shipping.seller_note;
      }
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

  user() {
    return this.belongsTo('User', 'id_user');
  }

  static create(data) {
    return new this(data).save().catch(() => {
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

  static async detail(userId, bucketId, id, domain) {
    let invoice = await this.where({
      id_invoice: id,
      id_user: userId,
      id_bucket: bucketId,
    }).fetch({
      withRelated: [
        'items.product.images',
        'store',
        'shipping.address',
        'shipping.expeditionService.expedition',
        { dispute: qb => qb.orderBy('createdate_dispute', 'desc') },
        'dispute.disputeProducts',
        'store.user.addresses.district',
        'store.user.addresses.province',
      ],
    });

    if (!invoice) throw getInvoiceError('invoice', 'not_found');

    let storeId = invoice.get('id_toko');
    let items = invoice.related('items');
    const firstItem = items.models[0].serialize();
    if (firstItem.dropshipper_id) {
      const dropship = await Dropship.where('id_dropshipper', firstItem.dropshipper_id).fetch();
      storeId = dropship.serialize().store_id;
    }

    items = items.map((item) => {
      const product = item.related('product');
      const image = product.related('images').models;
      return {
        ...item.serialize({ note: true }),
        product: {
          ...product.serialize({ minimal: true }),
          id: `${product.get('id_produk')}.${storeId}`,
          image: image.length ? image[0].serialize(domain).file : config.defaultImage.product,
        },
      };
    });

    let dispute = invoice.related('dispute').get('id_dispute') ? invoice.related('dispute') : null;
    if (dispute) {
      dispute = {
        ...dispute.serialize(domain),
        dispute_products: dispute.related('disputeProducts').map((val) => {
          const item = _.find(items, (o) => {
            const { productId } = getProductAndStore(o.product.id);
            return productId === val.get('id_produk');
          });
          return { ...val.serialize(), product: item.product };
        }),
      };
    }

    const store = invoice.related('store');
    const { origin } = Store.getOriginAndDistrict(store);
    invoice = invoice.serialize({}, domain);
    invoice = {
      ...invoice,
      store: {
        ...store.serialize({ favorite: true }, domain),
        origin,
      },
    };

    return { ...invoice, items, dispute };
  }

  /**
   * Get invoice for bulk create review & dispute
   */
  static async get(userId, bucketId, id, withRelated = ['items'], solution = null) {
    const invoice = await this
      .where({ id_invoice: id, id_user: userId, id_bucket: bucketId })
      .query(qb => qb.whereIn('status_transaksi', [
        InvoiceTransactionStatus.SENDING,
        InvoiceTransactionStatus.PROBLEM,
      ]))
      .fetch({ withRelated });
    if (!invoice) throw getInvoiceError('invoice', 'not_found');
    if (invoice.get('status_transaksi') === InvoiceTransactionStatus.PROBLEM) {
      await this.checkDispute(invoice, solution);
    }
    return invoice;
  }

  static async checkDispute(invoice, solution) {
    await invoice.load('dispute');
    const dispute = invoice.related('dispute');
    const disputeObj = dispute.serialize();
    if (
      disputeObj.solution !== DisputeSolutionType.EXCHANGE
      && disputeObj.status !== DisputeStatus.SEND_BY_SELLER
      && solution === DisputeSolutionType.REFUND
    ) {
      throw getInvoiceError('invoice', 'dispute_disable');
    }
    return dispute;
  }

  /**
   * @param id {int} store id
   * @param invoiceStatus {int}
   * @param page {int}
   * @param pageSize {int}
   * @param domain {string}
   * @param isJoin {boolean}
   */
  static async getOrders(id, invoiceStatus, page, pageSize, domain, isJoin) {
    let where = { 'invoice.id_toko': id };
    if (invoiceStatus) where = { ...where, status_transaksi: invoiceStatus };
    const invoices = await this.query((qb) => {
      if (!isJoin) qb.where(where);
      qb.distinct();
      if (!invoiceStatus) {
        qb.whereNotIn('status_transaksi', [
          InvoiceTransactionStatus.WAITING,
          InvoiceTransactionStatus.PROCEED,
        ]);
        qb.whereNotNull('status_transaksi');
      }
      if (isJoin) {
        qb.join('listbucket as l', 'l.id_invoice', 'invoice.id_invoice')
          .innerJoin('dropshipper as d', 'd.id_dropshipper', 'l.id_dropshipper')
          .andWhere('d.id_toko', id);
      } else if (isJoin === undefined) {
        qb.join('listbucket as l', 'l.id_invoice', 'invoice.id_invoice')
          .leftJoin('dropshipper as d', 'd.id_dropshipper', 'l.id_dropshipper')
          .orWhere('d.id_toko', id)
          .andWhere('status_transaksi', invoiceStatus);
      }
    })
      .orderBy('updated_at', 'desc')
      .fetchPage({ page, pageSize, withRelated: ['items.product.image', 'buyer'], debug: true });

    if (!invoices) return [];
    return invoices.map((invoice) => {
      const products = invoice.related('items').map((item) => {
        const product = item.related('product');
        const image = product.related('image').serialize(domain).file;
        return { ...product.serialize({ minimal: true }, domain), image };
      });
      const isDropship = !!invoice.related('items').models[0].get('id_dropshipper');
      const user = invoice.related('buyer').serialize({ orderDetail: true }, domain);
      invoice = invoice.serialize({ minimal: true }, domain);
      if (!isDropship) invoice.type = 'buyer';
      else if (Number(id) === Number(invoice.store_id)) invoice.type = 'seller';
      else invoice.type = 'reseller';
      return { invoice, products, user };
    });
  }

  /**
   * @param id {int} invoice id
   * @param store {object}
   * @param domain {string}
   * @param invoiceStatus {object}
   */
  static async getOrderDetail(id, store, domain, invoiceStatus = null) {
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

    const getBuyerAddress = invoice
      .related('shipping')
      .related('address')
      .load(['province', 'district', 'subDistrict', 'village']);

    const seller = invoice.related('store').related('user');

    const getSellerAddress = seller
      .related('address')
      .load(['province', 'district', 'subDistrict', 'village']);

    const items = invoice.related('items').map((item) => {
      const product = item.related('product');
      const image = product.related('image').serialize(domain).file;
      let review = item.related('review');
      review = review.serialize().id ? review : null;
      item = item.serialize({ minimal: true, note: true });
      item = { ...item, product: { ...product.serialize({ minimal: true }, domain), image } };
      if (!invoiceStatus) {
        item = {
          ...item,
          review: invoice.get('status_transaksi') === InvoiceTransactionStatus.RECEIVED ? review : null,
        };
      }
      return item;
    });

    const getLimit = invoiceStatus === InvoiceTransactionStatus.PROCEED ? Preference.get('order_response') : false;
    const [buyerAddress, sellerAddress, limit] = await Promise.all([
      getBuyerAddress,
      getSellerAddress,
      getLimit,
      getBuyer,
    ]);

    const buyer = invoice.related('buyer').serialize({ orderDetail: true }, domain);
    const result = {
      invoice: {
        ...invoice.serialize({ minimal: true, orderDetail: true }, domain),
        day_limit: limit ? parseNum(limit.value) : null,
        date_limit: limit ? moment(invoice.get('createdate_invoice')).add(limit.value, 'd').unix() : null,
      },
      items,
      buyer: { ...buyer, address: buyerAddress.serialize({ full: true }) },
      seller: {
        ...seller.serialize({ orderDetail: true }, domain),
        address: sellerAddress.serialize({ full: true }),
      },
    };

    if (storeDropshipId) {
      const isReseller = Number(storeDropshipId) === Number(storeId);
      const dropshipStore = await getStore;
      const resellerStore = dropshipStore.serialize({ favorite: true }, domain);
      // include reseller logo if we are the original seller
      resellerStore.logo = isReseller ? null : resellerStore.logo;
      result.reseller = { store: resellerStore };
      result.invoice.type = isReseller ? 'reseller' : 'seller';
    } else {
      result.invoice.type = 'buyer';
    }

    if (!invoiceStatus) {
      const shipping = invoice.related('shipping').serialize(domain);
      delete shipping.address;
      delete shipping.expedition_service;
      const dispute = invoice.related('dispute').serialize(domain);
      return {
        ...result,
        shipping,
        dispute: dispute.id ? dispute : null,
      };
    }

    return result;
  }

  static updateStatus(id, status) {
    const now = moment().toDate();
    const data = { status_transaksi: status, updated_at: now };
    if (status === InvoiceTransactionStatus.PROCEED) data.confirmation_date = now;
    return this.where({ id_invoice: id }).save(data, { patch: true });
  }

  static getWithDropship(id) {
    return this.where('id_invoice', id).fetch({ withRelated: ['item.dropship'] });
  }

  static getCount(storeId, status = null) {
    return this.query((qb) => {
      qb.where('invoice.id_toko', storeId);

      if (status) {
        qb.where('status_transaksi', status);

        qb.join('listbucket as l', 'l.id_invoice', 'invoice.id_invoice')
          .leftJoin('dropshipper as d', 'd.id_dropshipper', 'l.id_dropshipper')
          .orWhere('d.id_toko', storeId)
          .andWhere('status_transaksi', status);
      } else {
        qb.whereNotIn('status_transaksi', [InvoiceTransactionStatus.WAITING, InvoiceTransactionStatus.PROCEED]);
        qb.whereNotNull('status_transaksi');
      }
      qb.countDistinct('invoice.id_invoice');
    }).fetch();
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
