import core from '../../core';
import { SummTransType, TransSummary } from './transaction_summary';
import { TransType } from './transaction_type';
import { User } from '../../user/model/user';
import { TransactionLog, PaymentMethod } from '../../payment/model';

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

  static async updateStatus(id, status, paymentMethodId) {
    const topup = await this.where({ id }).fetch();
    return await topup.save({ status, id_paymentmethod: paymentMethodId }, { patch: true });
  }

  static async midtransNotification(id, body) {
    let status;
    switch (body.status_code) {
      case '200':
        status = {
          topup: TopupStatus.SUCCESS,
          log: 'success',
        };
        break;
      case '201':
        status = {
          topup: TopupStatus.WAITING,
          log: 'pending',
        };
        break;
      case '202':
        status = {
          topup: TopupStatus.FAILED,
          log: 'denied',
        };
        break;
      default:
        break;
    }

    TransactionLog.create({
      order_id: id,
      transaction_name: 'TOPUP',
      payment_method: 'midtrans',
      response_data: body,
      status: status.log,
    });

    const paymentMethodId = await PaymentMethod.getMidtransPaymentMethod(body.payment_type);
    const topup = await this.updateStatus(id, status.topup, paymentMethodId);
    const [remark, user] = await Promise.all([
      TransType.getRemark(SummTransType.TOPUP),
      User.where('id_users', topup.get('id_users')).fetch(),
    ]);
    const saldo = user.serialize().saldo_wallet;
    const amount = topup.serialize().amount;
    const updateSaldo = saldo + amount;
    await TransSummary.create(TransSummary.matchDBColumn({
      amount,
      first_saldo: saldo,
      last_saldo: updateSaldo,
      user_id: id,
      type: SummTransType.TOPUP,
      remark,
      summaryable_type: 'topup_wallet',
      summaryable_id: topup.get('id'),
    }));
    await user.save({ saldo_wallet: updateSaldo }, { patch: true });
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
