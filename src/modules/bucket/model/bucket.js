import ModelBase from 'bookshelf-modelbase';
import randomInt from 'random-int';
import moment from 'moment';
import 'moment-precise-range-plugin';
import core from '../../core';
import { getBucketError } from '../messages';
import { getPaymentError } from '../../payment/messages';
import './item';
import './shipping';
import config from './../../../../config';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;
bookshelf.plugin(ModelBase.pluggable);

export const BucketStatus = {
  ADDED: 0,
  CHECKOUT: 1,
  DELETED: 2,
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
      promo_id: this.get('id_promo'),
      promo: this.relations.promo ? this.related('promo').serialize() : null,
      payment_method_id: this.get('id_paymentmethod'),
      unique_code: this.get('kode_unik'),
      order_at: parseDate(this.get('tgl_orderbucket')),
      wallet: parseNum(this.get('bayar_wallet')),
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
  static async getDetail(userId) {
    const bucket = await this.where({ id_users: userId, status_bucket: BucketStatus.ADDED }).fetch({
      withRelated: [
        'promo',
        'items.product.store',
        { 'items.product.images': qb => (qb.limit(1)) },
        'items.shipping.address',
        'items.shipping.expeditionService.expedition',
      ],
    });
    if (!bucket) throw getBucketError('bucket', 'not_found');
    const items = bucket.related('items').map((item) => {
      let product = item.related('product');
      const shipping = item.related('shipping');
      const store = product.related('store');
      const images = product.related('images').serialize();
      product = product.serialize({ minimal: true });
      product.image = images.length ? images[0].file : config.defaultImage.product;
      product.store = store.serialize();
      return {
        ...item.serialize(),
        product,
        shipping,
      };
    });
    return { ...bucket.serialize(), items };
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
  static async findOrCreateBucket(userId) {
    return await this.findOrCreate({
      id_users: userId,
      status_bucket: BucketStatus.ADDED,
    }, {
      defaults: this.matchDBColumn({
        wallet: 0,
        unique_code: randomInt(100, 999),
        order_at: new Date(),
        status_at: new Date(),
      }),
    });
  }

  static getTimeLeft(maxTime) {
    const maxPaymentDate = moment(maxTime).add(2, 'days');
    if (moment().isAfter(maxPaymentDate)) return 0;
    const { days, hours, minutes, seconds } = moment.preciseDiff(maxPaymentDate, moment(), true);
    return { days, hours, minutes, seconds };
  }

  static async listTransactions(userId) {
    const buckets = await this.where({ id_users: userId, status_bucket: BucketStatus.CHECKOUT })
      .query(qb => (qb.whereNotNull('id_paymentmethod')))
      .fetchAll({ withRelated: ['invoices.items.product.images'] });
    if (!buckets.length) throw getBucketError('bucket', 'not_found');

    return buckets.map((bucket) => {
      const { invoices, total_price, time_left } = bucket.related('invoices').reduce((accu, invoice, index) => {
        const items = invoice.related('items').map((item) => {
          const product = item.related('product');
          return {
            ...item.serialize({ minimal: true }),
            product: {
              ...product.serialize({ minimal: true }),
              image: product.related('images').models[0].serialize().file,
            },
          };
        });
        accu.total_price += parseInt(invoice.get('total_harga'), 10);
        accu.invoices.push({ ...invoice.serialize({ minimal: true }), items });
        if (index === 0) accu.time_left = this.getTimeLeft(invoice.get('updated_at'));
        return accu;
      }, { total_price: 0, invoices: [], time_left: 0 });
      return {
        bucket: bucket.serialize(),
        summary_invoice: {
          total_price,
          status: 1,
          time_left,
        },
        invoices,
      };
    });
  }

  static async detailTransaction(userId, bucketId) {
    const bucket = await this.where({
      id_users: userId,
      id_bucket: bucketId,
      status_bucket: BucketStatus.CHECKOUT,
    }).query(qb => (qb.whereNotNull('id_paymentmethod')))
      .fetch({ withRelated: ['invoices.items.product.images', 'promo'] });
    if (!bucket) throw getBucketError('bucket', 'not_found');

    const { invoices, total_price, time_left } = bucket.related('invoices').reduce((accu, invoice, index) => {
      const items = invoice.related('items').map((item) => {
        const product = item.related('product');
        return {
          ...item.serialize({ minimal: true }),
          product: {
            ...product.serialize({ minimal: true }),
            image: product.related('images').models[0].serialize().file,
          },
        };
      });
      accu.total_price += parseInt(invoice.get('total_harga'), 10);
      accu.invoices.push({ ...invoice.serialize({ minimal: true }), items });
      if (index === 0) accu.time_left = this.getTimeLeft(invoice.get('updated_at'));
      return accu;
    }, { total_price: 0, invoices: [], time_left: 0 });
    return {
      bucket: bucket.serialize(),
      summary_invoice: {
        total_price,
        status: 1,
        time_left,
      },
      invoices,
    };
  }

  /**
   * Add promo
   * @param bucketId
   * @param promoId
   */
  static async addPromo(bucketId, promoId) {
    return await this.where({ id_bucket: bucketId }).save({ id_promo: promoId }, { patch: true });
  }

  /**
   * Cancel promo
   * @param bucketId
   */
  static async cancelPromo(bucketId) {
    return await this.where({ id_bucket: bucketId }).save({ id_promo: null }, { patch: true });
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
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Bucket = bookshelf.model('Bucket', BucketModel);
export default { Bucket };
