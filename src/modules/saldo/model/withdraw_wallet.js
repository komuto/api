import core from '../../core';

const { matchDB } = core.utils;
const bookshelf = core.postgres.db;

class WithdrawModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'withdraw_wallet';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['tanggal'];
  }

  bankAccount() {
    return this.belongsTo('BankAccount', 'id_rekeninguser');
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    data.status = '0';
    return new this(data).save();
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      amount: 'amount',
      bank_account_id: 'id_rekeninguser',
      marketplace_id: 'id_marketplaceuser',
      user_id: 'id_users',
    };
    return matchDB(data, column);
  }
}

export const Withdraw = bookshelf.model('Withdraw', WithdrawModel);
export default { Withdraw };
