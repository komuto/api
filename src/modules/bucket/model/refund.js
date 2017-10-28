import core from '../../core';

const { parseDate, matchDB } = core.utils;
const bookshelf = core.postgres.db;

export const RefundStatus = { PROCEED: 1, SUCCESS: 2 };

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
    return ['create_at'];
  }

  serialize({ minimal = false } = {}) {
    const refund = {
      id: this.get('id_refund'),
      refund_number: this.get('no_refund'),
      created_at: parseDate(this.get('create_at')),
    };
    if (minimal) return refund;
    return {
      ...refund,
      bucket_id: this.get('id_bucket'),
      invoice_id: this.get('id_invoice'),
      dispute_id: this.get('id_dispute'),
      total: this.get('total_refund'),
      status: this.get('status_refund'),
    };
  }

  items() {
    return this.hasMany('RefundItem', 'id_refund');
  }

  static create(data) {
    return new this(data).save();
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      bucket_id: 'id_bucket',
      invoice_id: 'id_invoice',
      dispute_id: 'id_dispute',
      refund_number: 'no_refund',
      total: 'total_refund',
      status: 'status_refund',
    };
    return matchDB(data, column);
  }
}

export const Refund = bookshelf.model('Refund', RefundModel);
