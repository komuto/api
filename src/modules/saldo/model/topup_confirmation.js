import core from '../../core';

const { matchDB, parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

class TopupConfModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'topup_confirmation';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['tanggal'];
  }

  serialize() {
    // TODO: Doesn't include all columns yet
    return {
      id: parseNum(this.get('id')),
      user_id: parseNum(this.get('id_users')),
      marketplace_id: this.get('id_marketplaceuser'),
      amount: this.get('amount'),
      status: parseNum(this.get('status'), 0),
      created_at: parseDate(this.get('tanggal')),
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
      amount: 'amount',
      status: 'status',
    };
    return matchDB(data, column);
  }
}

export const TopupConf = bookshelf.model('TopupConf', TopupConfModel);
export default { TopupConf };
