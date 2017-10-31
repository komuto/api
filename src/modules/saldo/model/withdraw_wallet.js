import core from '../../core';

const { matchDB, parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const WithdrawStatus = {
  WAITING: 0,
  SUCCESS: 1,
  FAILED: 2,
};

class WithdrawModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'withdraw_wallet';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['tanggal'];
  }

  serialize() {
    return {
      id: parseNum(this.get('id')),
      user_id: parseNum(this.get('id_users')),
      marketplace_id: this.get('id_marketplaceuser'),
      bank_account_id: parseNum(this.get('id_rekeninguser')),
      bank_account: this.relations.bankAccount ? this.related('bankAccount') : undefined,
      amount: this.get('amount'),
      status: parseNum(this.get('status')),
      created_at: parseDate(this.get('tanggal')),
    };
  }

  bankAccount() {
    return this.belongsTo('BankAccount', 'id_rekeninguser');
  }

  static get(userId, page, pageSize) {
    return this.where({ id_users: userId }).fetchPage({ page, pageSize, withRelated: ['bankAccount.bank'] });
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
      user_id: 'id_users',
      marketplace_id: 'id_marketplaceuser',
      bank_account_id: 'id_rekeninguser',
      amount: 'amount',
    };
    return matchDB(data, column);
  }
}

export const Withdraw = bookshelf.model('Withdraw', WithdrawModel);
export default { Withdraw, WithdrawStatus };
