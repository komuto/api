import core from '../../core';

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
}

export const DetailTransSummary = bookshelf.model('DetailTransSummary', detailTransSummaryModel);
export default { DetailTransSummary };
