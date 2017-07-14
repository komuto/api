import ModelBase from 'bookshelf-modelbase';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';
import './item';
import './shipping';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;
bookshelf.plugin(ModelBase.pluggable);

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
      id: this.get('id_ulasanproduk'),
      user_id: this.get('id_users'),
      promo_id: this.get('id_promo'),
      promo: this.relations.promo ? this.related('promo') : undefined,
      order_at: parseDate(this.get('tgl_orderbucket')),
      wallet: parseNum(this.get('bayar_wallet')),
      payment_method: this.get('method_paymentbucket'),
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
      status_bucket: 0,
    }).fetch({ withRelated: ['items'] });
    return bucket ? bucket.related('items').length : 0;
  }

  /**
   * Get bucket
   */
  static async get(userId) {
    const bucket = await this.where({ id_users: userId, status_bucket: 0 }).fetch({
      withRelated: [
        'promo',
        'items.product.store',
        {
          'items.product.images': (qb) => {
            qb.limit(1);
          },
        },
        'items.shipping.address',
        'items.shipping.expeditionService.expedition',
      ],
    });
    if (!bucket) throw new BadRequestError('No bucket found');
    const items = bucket.related('items').map((item) => {
      let product = item.related('product');
      const shipping = item.related('shipping');
      const store = product.related('store');
      const images = product.related('images').serialize();
      product = product.serialize({ minimal: true });
      product.image = images.length ? images[0].file : null;
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
   * Find bucket
   */
  static async findBucket(userId) {
    return await this.findOrCreate({
      id_users: userId,
      status_bucket: 0,
    }, {
      defaults: this.matchDBColumn({
        wallet: 0,
        order_at: new Date(),
        status_at: new Date(),
      }),
    });
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
      payment_method: 'method_paymentbucket',
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
