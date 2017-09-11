import core from '../../core';

const { matchDB } = core.utils;
const bookshelf = core.postgres.db;

class detailTransSummaryModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detail_summary_transaksi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_detail_summary';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  /**
   * Add relation to Bucket
   */
  bucket() {
    return this.belongsTo('Bucket', 'id_bucket', 'id_bucket');
  }

  serialize() {
    return {
      id: this.get('id_detail_summary'),
      transaction_summary_id: this.get('id_summarytransaksi'),
      bucket_id: this.get('id_bucket'),
    };
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    return new this(data).save();
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      transaction_summary_id: 'id_summarytransaksi',
      bucket_id: 'id_bucket',
    };
    return matchDB(data, column);
  }
}

export const DetailTransSummary = bookshelf.model('DetailTransSummary', detailTransSummaryModel);
export default { DetailTransSummary };
