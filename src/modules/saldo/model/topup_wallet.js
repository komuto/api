import core from '../../core';
import { SummTransType, TransSummary } from './transaction_summary';
import { TransType } from './transaction_type';
import { User } from '../../user/model/user';

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
      platform: this.get('platform'),
      created_at: parseDate(this.get('datecreated')),
    };
  }

  paymentMethod() {
    return this.belongsTo('PaymentMethod', 'id_paymentmethod');
  }

  topupConf() {
    return this.hasOne('TopupConf', 'id_topup_wallet');
  }

  static async get(userId, page, pageSize) {
    return await new this({ id_users: userId }).fetchPage({ page, pageSize });
  }

  static async updateStatus(id, status) {
    return await this.where({ id }).save({ status }, { patch: true });
  }

  static async midtransNotification(id, body) {
    let status;
    switch (body.status_code) {
      case '200':
        status = TopupStatus.SUCCESS;
        break;
      case '201':
        status = TopupStatus.WAITING;
        break;
      case '202':
        status = TopupStatus.FAILED;
        break;
      default:
        break;
    }
    const topup = await this.updateStatus(id, status);
    const [remark, user] = await Promise.all([
      TransType.getRemark(SummTransType.TOPUP),
      User.where('id_users', topup.get('id_users')).fetch(),
    ]);
    await TransSummary.create(TransSummary.matchDBColumn({
      amount: topup.get('amount'),
      first_saldo: user.get('saldo_wallet'),
      last_saldo: user.get('saldo_wallet') - topup.get('amount'),
      user_id: id,
      type: SummTransType.TOPUP,
      remark,
      summaryable_type: 'topup_wallet',
      summaryable_id: topup.get('id'),
    }));
    return topup;
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
      platform: 'platform',
      created_at: 'datecreated',
    };
    return matchDB(data, column);
  }
}

export const Topup = bookshelf.model('Topup', TopupModel);
export default { Topup, TopupStatus };
