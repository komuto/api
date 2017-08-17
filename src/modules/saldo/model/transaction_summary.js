import core from '../../core';

const { matchDB } = core.utils;
const bookshelf = core.postgres.db;

export const TransType = {
  PAYMENT: 'PAID',
  REFUND: 'RFND',
  SELLING: 'SELL',
  TOPUP: 'TPUP',
  WITHDRAW: 'WTHD',
};

class transSummaryModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'summary_transaksi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_summarytransaksi';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['tgl_summarytransaksi', 'tglstatus_summarytransaksi'];
  }
  /**
   * Create a new line item
   * @param {Object} data
   * @param type {string} transaction type
   */
  static async create(data, type) {
    data = {
      ...data,
      kode_summarytransaksi: type,
      status_summarytransaksi: '1',
      is_debit: false,
    };
    return new this(data).save();
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      amount: 'nominal_summarytransaksi',
      first_saldo: 'saldo_awal',
      last_saldo: 'saldo_akhir',
      marketplace_id: 'id_marketplaceuser',
      user_id: 'id_users',
    };
    return matchDB(data, column);
  }
}

export const TransSummary = bookshelf.model('TransSummary', transSummaryModel);
export default { TransSummary };
