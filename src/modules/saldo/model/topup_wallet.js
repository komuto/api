import core from '../../core';

const { matchDB, parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const TopupStatus = {
  WAITING: 0,
  SUCCESS: 1,
  FAILED: 2,
};

class TopupModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'topup_wallet';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['datecreated'];
  }

  serialize() {
    return {
      id: parseNum(this.get('id')),
      user_id: parseNum(this.get('id_users')),
      marketplace_id: this.get('id_marketplaceuser'),
      payment_method_id: this.get('id_paymentmethod'),
      amount: this.get('amount'),
      status: parseNum(this.get('status'), 0),
      created_at: parseDate(this.get('datecreated')),
    };
  }

  static async get(userId, page, pageSize) {
    return await new this({ id_users: userId }).fetchPage({ page, pageSize });
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
      payment_method_id: 'id_paymentmethod',
      amount: 'amount',
      status: 'status',
      created_at: 'datecreated',
    };
    return matchDB(data, column);
  }
}

export const Topup = bookshelf.model('Topup', TopupModel);
export default { Topup, TopupStatus };
