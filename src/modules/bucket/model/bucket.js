import ModelBase from 'bookshelf-modelbase';
import moment from 'moment';
import _ from 'lodash';
import 'moment-precise-range-plugin';
import core from '../../core';
import { getBucketError, getTransactionError } from '../messages';
import './shipping';
import { Item } from './item';
import { PromoType } from './promo';
import config from './../../../../config';
import { InvoiceStatus, InvoiceTransactionStatus, TransactionLog, PaymentMethod, Invoice } from '../../payment/model';
import { Preference } from '../../preference/model';
import { Marketplace } from '../../marketplace/model/marketplace';

const { Notification, sellerNotification } = core;
const { parseNum, parseDate, matchDB } = core.utils;
const bookshelf = core.postgres.db;
bookshelf.plugin(ModelBase.pluggable);

export const BucketStatus = {
  ADDED: 0,
  CHECKOUT: 1,
  DELETED: 2,
  WAITING_FOR_PAYMENT: 3,
  WAITING_FOR_VERIFICATION: 4,
  EXPIRED: 5,
  PAYMENT_RECEIVED: 6,
  CANCEL: 7,
};

class BucketModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'bucket';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_bucket';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    const bucket = {
      id: this.get('id_bucket'),
      user_id: this.get('id_users'),
      marketplace_id: this.get('id_marketplaceuser'),
      promo_id: this.get('id_promo'),
      promo: this.relations.promo ? this.related('promo').serialize() : null,
      payment_method_id: this.get('id_paymentmethod'),
      unique_code: this.get('kode_unik'),
      total_bill: parseNum(this.get('total_tagihan')),
      order_at: parseDate(this.get('tgl_orderbucket')),
      wallet: parseNum(this.get('bayar_wallet')),
      platform: this.get('platform'),
      status: parseNum(this.get('status_bucket')),
      status_at: parseDate(this.get('tglstatus_bucket')),
    };
    if (this.relations.promo) delete bucket.promo_id;
    return bucket;
  }

  /**
   * Add relation to item
   */
  items() {
    return this.hasMany('Item', 'id_bucket');
  }

  invoices() {
    return this.hasMany('Invoice', 'id_bucket');
  }

  /**
   * Add relation to promo
   */
  promo() {
    return this.belongsTo('Promo', 'id_promo');
  }

  /**
   * Get count
   */
  static async getCount(userId) {
    const bucket = await this.where({
      id_users: userId,
      status_bucket: BucketStatus.ADDED,
    }).fetch({ withRelated: ['items'] });
    return bucket ? bucket.related('items').length : 0;
  }

  /**
   * Get detail bucket
   */
  static async getDetail(userId, domain) {
    const bucket = await this.where({ id_users: userId, status_bucket: BucketStatus.ADDED }).fetch({
      withRelated: [
        'promo',
        { 'items.product.store.user.addresses': qb => (qb.where('alamat_originjual', 1)) },
        'items.product.store.user.addresses.district',
        'items.product.expeditionServices.expedition',
        'items.product.wholesale',
        'items.product.image',
        'items.shipping.address.province',
        'items.shipping.address.district',
        'items.shipping.address.subDistrict',
        'items.shipping.expeditionService.expedition',
      ],
    });
    if (!bucket) throw getBucketError('bucket', 'not_found');
    const items = await Promise.all(
      bucket.related('items').map(async item => await Item.loadDetailItem(item, domain)),
    );
    return { ...bucket.serialize(), items };
  }

  /**
   * Get detail bucket for snap
   */
  static async getForPayment(userId, bucketId, platform = null) {
    const bucket = await this.where({
      id_users: userId,
      id_bucket: bucketId,
      status_bucket: BucketStatus.WAITING_FOR_PAYMENT,
    }).fetch({ withRelated: ['items.product', 'promo'] });
    if (!bucket) throw getBucketError('bucket', 'not_found');
    if (platform) bucket.save({ platform }, { patch: true });
    bucket.related('items').each((item) => {
      item = item.serialize();
      if (item.product.stock < item.qty) throw getBucketError('item', 'stock');
    });
    return bucket;
  }

  /**
   * Get bucket
   */
  static async get(userId, status = BucketStatus.ADDED) {
    const bucket = await this.where({
      id_users: userId,
      status_bucket: status,
    }).fetch();
    if (!bucket) throw getBucketError('bucket', 'not_found');
    return bucket;
  }

  /**
   * Find by id
   */
  static async findByIdAndStatus(id, userId, status) {
    const bucket = await this.where({
      id_bucket: id,
      id_users: userId,
      status_bucket: status,
    }).fetch();
    if (!bucket) throw getBucketError('bucket', 'not_found');
    return bucket;
  }

  /**
   * Get bucket with relation for checkout
   */
  static async getForCheckout(userId) {
    const bucket = await this.where({ id_users: userId, status_bucket: BucketStatus.ADDED }).fetch({
      withRelated: ['promo', 'items.product', 'items.shipping'],
    });
    if (!bucket) throw getBucketError('bucket', 'not_found');
    return bucket;
  }

  /**
   * Find bucket
   */
  static findOrCreateBucket(userId, marketplaceId) {
    return this.findOrCreate({
      id_users: userId,
      status_bucket: BucketStatus.ADDED,
    }, {
      defaults: this.matchDBColumn({
        marketplace_id: marketplaceId,
        wallet: 0,
        unique_code: 0,
        order_at: moment().toDate(),
        status_at: moment().toDate(),
      }),
    });
  }

  static getTimeLeft(maxTime, limit) {
    const maxPaymentDate = moment(maxTime).add(limit, 'days');
    if (moment().isAfter(maxPaymentDate)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const { days, hours, minutes, seconds } = moment.preciseDiff(maxPaymentDate, moment(), true);
    return { days, hours, minutes, seconds };
  }

  static loadDetailTransaction(bucket, limit, isDetail, domain) {
    const { data, total_price, time_left } = bucket.related('invoices').reduce((accu, invoice, index) => {
      const items = invoice.related('items').map((item) => {
        let product = item.related('product');
        const image = product.related('images').models;
        product = {
          ...product.serialize({ minimal: true }),
          image: image.length ? image[0].serialize(domain).file : config.defaultImage.product,
        };
        if (isDetail) {
          return {
            ...item.serialize({ minimal: true }),
            product,
          };
        }
        return product;
      });
      accu.total_price += parseInt(invoice.get('total_harga'), 10);
      if (isDetail) {
        const invoiceObj = { ...invoice.serialize({ minimal: true }, domain), items };
        invoiceObj.shipping = invoiceObj.shipping ? invoiceObj.shipping : null;
        accu.data.push(invoiceObj);
      } else {
        accu.data.push(...items);
      }
      if (index === 0) accu.time_left = this.getTimeLeft(invoice.get('updated_at'), limit);
      return accu;
    }, { total_price: 0, data: [], time_left: { days: 0, hours: 0, minutes: 0, seconds: 0 } });

    const response = {
      bucket: bucket.serialize(),
      summary_transaction: { total_price, time_left },
    };

    if (isDetail) return { ...response, invoices: data };
    return { ...response, products: data };
  }

  static async listTransactions(userId, page, pageSize, domain) {
    const buckets = await this.where({ id_users: userId })
      .query(qb => qb.whereNotIn('status_bucket', [BucketStatus.ADDED, BucketStatus.DELETED, BucketStatus.CANCEL]))
      .orderBy('tgl_orderbucket', 'desc')
      .fetchPage({ page, pageSize, withRelated: ['invoices.items.product.images'] });
    if (!buckets.length) return [];
    const limit = await Preference.get('payment');
    return buckets.map(bucket => (this.loadDetailTransaction(bucket, limit.value, false, domain)));
  }

  static async detailTransaction(userId, bucketId, domain) {
    const bucket = await this.where({ id_users: userId, id_bucket: bucketId })
      .query(qb => qb.whereNotIn('status_bucket', [BucketStatus.ADDED, BucketStatus.DELETED]))
      .fetch();
    if (!bucket) throw getTransactionError('transaction', 'not_found');
    const status = bucket.serialize().status;
    if (status === BucketStatus.ADDED || status === BucketStatus.WAITING_FOR_PAYMENT) {
      await Promise.all([
        bucket.load([
          'invoices.items.product.images',
          'promo',
          'invoices.store',
          'invoices.shipping.address',
          'invoices.shipping.expeditionService.expedition',
        ]),
      ]);
    } else {
      await Promise.all([bucket.load(['invoices.items.product.images', 'promo', 'invoices.store'])]);
    }
    const limit = await Preference.get('payment');
    return this.loadDetailTransaction(bucket, limit.value, true, domain);
  }

  /**
   * Cancel promo
   * @param bucketId
   */
  static cancelPromo(bucketId) {
    return this.where({ id_bucket: bucketId }).save({ id_promo: null }, { patch: true });
  }

  static async getTotalPrice(userId) {
    const bucket = await this.getForCheckout(userId);
    let items = bucket.related('items');
    if (items.length === 0) throw getBucketError('bucket', 'not_found_items');

    const groups = _.groupBy(items.models, (val) => {
      const { store_id: storeId, shipping } = val.serialize();
      return `${storeId}#${shipping.address_id}#${shipping.expedition_service_id}`;
    });

    items = _.map(groups, group => ({
      shipping_id: group[0].serialize().shipping.id,
      store_id: group[0].serialize().store_id,
      items: group,
    }));

    return items.reduce((sum, val) => {
      const bucketObj = bucket.serialize();
      const weight = val.items[0].serialize().weight;
      const deliveryCost = val.items[0].serialize().shipping.delivery_cost
        / Math.ceil(weight / 1000);

      let totalPrice = 0;
      let adminCost = 0;
      let insuranceFee = 0;
      let totalWeight = 0;
      _.forEach(val.items, (o) => {
        o = o.serialize();
        totalPrice += o.product.price * o.qty;
        adminCost += o.additional_cost;
        insuranceFee += o.shipping.insurance_fee;
        totalWeight += o.weight;
      });

      let promo = 0;
      if (bucketObj.promo) {
        if (bucketObj.promo.type === PromoType.NOMINAL) {
          promo = bucketObj.promo.nominal / items.length;
        } else promo = (totalPrice * bucketObj.promo.percentage) / 100;
      }

      const totalDeliveryCost = deliveryCost * Math.ceil(totalWeight / 1000);
      totalPrice += (adminCost + insuranceFee + totalDeliveryCost) - promo;

      return sum + totalPrice;
    }, 0);
  }

  static async updateStatus(id, status, related, paymentMethodId) {
    const bucket = await this.where({ id_bucket: id }).fetch({ withRelated: related });
    const marketplace = await Marketplace.where('id_marketplaceuser', bucket.get('id_marketplaceuser')).fetch();

    if (status.invoice !== InvoiceStatus.UNPAID) {
      await Promise.all(bucket.related('invoices').map(async (invoice) => {
        if (status.invoice === InvoiceStatus.PAID) {
          await this.updateStockAndSendNotification(invoice, marketplace.serialize());
        }

        return await invoice.save({
          status_invoice: status.invoice,
          status_transaksi: status.transaction,
          id_paymentmethod: paymentMethodId,
        }, { patch: true });
      }));
    }

    if (status.invoice !== InvoiceStatus.PAID) {
      Invoice.where('id_bucket', bucket.id).save({ id_paymentmethod: paymentMethodId }, { patch: true });
    }

    if (status.bucket === BucketStatus.PAYMENT_RECEIVED && bucket.get('id_promo')) {
      const promo = bucket.related('promo');
      // eslint-disable-next-line no-plusplus
      await promo.save({ kuota_promo: --promo.serialize().quota }, { patch: true });
    }

    return await bucket.save({
      status_bucket: status.bucket,
      id_paymentmethod: paymentMethodId,
    }, { patch: true });
  }

  static async updateStockAndSendNotification(invoice, marketplace) {
    let dropshipper;
    await Promise.all(invoice.related('items').map(async (item, i) => {
      const product = item.related('product');
      const { stock, count_sold: sold } = product.serialize();
      const qty = item.serialize().qty;
      let updateSold = sold + qty;

      if (item.get('id_dropshipper')) {
        updateSold = sold;
        const dropship = item.related('dropship');
        await dropship.save({
          count_sold: dropship.serialize().count_sold + qty,
        }, { patch: true });
        if (i === 0) dropshipper = dropship.related('store').related('user');
      }

      const updatedStock = stock - qty;

      return await product.save({
        // preventing stock to be minus
        stock_produk: updatedStock < 0 ? 0 : updatedStock,
        count_sold: updateSold,
      }, { patch: true });
    }));

    const owner = invoice.related('store').related('user');
    if (owner.get('reg_token')) {
      Notification.send(
        sellerNotification.TRANSACTION,
        owner.get('reg_token'),
        marketplace,
        { invoice_id: String(invoice.id), click_action: `order-detail?id=${invoice.id}` },
      );
    }

    if (dropshipper && dropshipper.get('req_token')) {
      Notification.send(
        sellerNotification.TRANSACTION,
        dropshipper.get('reg_token'),
        marketplace,
        { invoice_id: String(invoice.id), click_action: `order-detail?id=${invoice.id}` },
      );
    }
  }

  static async midtransNotification(id, body) {
    let status;
    let related = ['invoices'];
    switch (body.status_code) {
      case '200':
        status = {
          bucket: BucketStatus.PAYMENT_RECEIVED,
          invoice: InvoiceStatus.PAID,
          transaction: InvoiceTransactionStatus.WAITING,
          log: 'success',
        };
        related = [
          'invoices.items.product',
          'promo',
          'invoices.items.dropship.store.user',
          'invoices.store.user',
        ];
        break;
      case '201':
        status = {
          bucket: BucketStatus.WAITING_FOR_VERIFICATION,
          invoice: InvoiceStatus.UNPAID,
          transaction: null,
          log: 'pending',
        };
        break;
      case '202':
        status = {
          bucket: BucketStatus.EXPIRED,
          invoice: InvoiceStatus.FAILED,
          transaction: null,
          log: 'denied',
        };
        break;
      default:
        break;
    }

    TransactionLog.create({
      order_id: id,
      transaction_name: 'ORDER',
      payment_method: 'midtrans',
      response_data: body,
      status: status.log,
    });

    const paymentMethodId = await PaymentMethod.getMidtransPaymentMethod(body.payment_type);
    return await this.updateStatus(id, status, related, paymentMethodId);
  }

  async updateBill(plus, minus) {
    const bill = (Number(this.get('total_tagihan') || 0) - minus) + plus;
    return await this.save({ total_tagihan: bill }, { patch: true });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      promo_id: 'id_promo',
      order_at: 'tgl_orderbucket',
      wallet: 'bayar_wallet',
      unique_code: 'kode_unik',
      payment_method_id: 'id_paymentmethod',
      status: 'status_bucket',
      status_at: 'tglstatus_bucket',
      platform: 'platform',
      marketplace_id: 'id_marketplaceuser',
    };
    return matchDB(data, column);
  }
}

export const Bucket = bookshelf.model('Bucket', BucketModel);
export default { Bucket };
