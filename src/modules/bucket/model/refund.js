import core from '../../core';

const { parseNum, parseDate, matchDB } = core.utils;
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
    return matchDB(data, column);
  }
}

export const Bucket = bookshelf.model('Bucket', BucketModel);
export default { Bucket };
