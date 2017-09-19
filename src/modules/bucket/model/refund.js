import core from '../../core';

const { parseNum, parseDate, matchDB } = core.utils;
const bookshelf = core.postgres.db;

class RefundModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'bucket_refund';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_refund';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_refund'),
      bucket_id: this.get('id_users'),
      invoice_id: this.get('id_promo'),
      dispute_id: this.get('id_promo'),
      refund_number: this.get(''),
      total: this.get(''),
    };
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

export const Refund = bookshelf.model('Bucket', RefundModel);
export default { Refund };
