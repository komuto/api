import core from '../../core';
import './item';
import './shipping';

const { parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

class BucketModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'bucket';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_bucket';
  }

  /**
   * Add relation to item
    */
  items() {
    return this.hasMany('Item', 'id_bucket');
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
        'items.product.store',
        {
          'items.product.images': (qb) => {
            qb.limit(1);
          },
        },
        'items.shipping',
      ],
    });
    const items = bucket.related('items').map((item) => {
      const product = item.related('product');
      const shipping = item.related('shipping');
      const store = product.related('store');
      const images = product.related('images').serialize();
      return {
        item,
        image: images.length ? images[0] : null,
        product,
        store,
        shipping,
      };
    });
    return { bucket, items };
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
      admin_fee: 'biaya_admin',
      total_price: 'total_bucket',
      wallet: 'wallet_bucket',
      final_price: 'finalprice_bucket',
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

BucketModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_ulasanproduk,
    user_id: this.attributes.id_users,
    promo_id: this.attributes.id_promo,
    order_at: parseDate(this.attributes.tgl_orderbucket),
    admin_fee: parseNum(this.attributes.biaya_admin),
    total_price: parseNum(this.attributes.total_bucket),
    wallet: parseNum(this.attributes.wallet_bucket),
    final_price: parseNum(this.attributes.finalprice_bucket),
    payment_method: this.attributes.method_paymentbucket,
    status: parseNum(this.attributes.status_bucket),
    status_at: parseDate(this.attributes.tglstatus_bucket),
  };
};

export const Bucket = bookshelf.model('Bucket', BucketModel);
export default { Bucket };
