import core from '../../core';
import { BadRequestError } from '../../../../common/errors';
import { PromoType } from '../../bucket/model';
import { User } from '../../user/model';
import { TransType } from './transaction_type';
import { DetailTransSummary } from './detail_transaction_summary';

const { matchDB, parseNum } = core.utils;
const bookshelf = core.postgres.db;

export const SummTransType = {
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

  serialize() {
    return {
      id: this.get('id_summarytransaksi'),
      user_id: parseNum(this.get('id_users')),
      amount: parseNum(this.get('nominal_summarytransaksi')),
      first_saldo: parseNum(this.get('saldo_awal')),
      last_saldo: parseNum(this.get('saldo_akhir')),
      type: this.get('kode_summarytransaksi'),
      remark: this.get('remark'),
    };
  }

  /**
   * Add relation to DetailTransSummary
   */
  detailTransSummary() {
    return this.hasOne('DetailTransSummary', 'id_summarytransaksi', 'id_summarytransaksi');
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    data = {
      ...data,
      status_summarytransaksi: 1, // default value
      is_debit: false,
    };
    return new this(data).save();
  }

  static async get(userId) {
    const transactions = await this.where('id_users', userId).fetchAll({ withRelated: 'detailTransSummary' });
    return transactions.map((transaction) => {
      const detail = transaction.related('detailTransSummary');
      return {
        ...transaction.serialize(),
        bucket_id: detail.get('id_bucket') || null,
      };
    });
  }

  static checkSaldo(user, bucket, items) {
    let totalPrice = items.reduce((price, item) => (price += item.serialize().total_price), 0);

    let promo = 0;
    if (bucket.promo) {
      if (bucket.promo.type === PromoType.NOMINAL) {
        promo = bucket.promo.nominal / items.length;
      } else promo = (totalPrice * bucket.promo.percentage) / 100;
    }

    totalPrice -= promo;
    if (user.saldo_wallet < totalPrice) {
      throw new BadRequestError('Saldo tidak mencukupi');
    }
  }

  static async cutSaldo(user, totalPrice, bucket) {
    await User.updateWallet(user.id, user.saldo_wallet - totalPrice);
    const type = await TransType.where('kode_tipetransaksi', SummTransType.PAYMENT).fetch();
    const summary = await this.create(this.matchDBColumn({
      amount: totalPrice,
      first_saldo: user.saldo_wallet,
      last_saldo: user.saldo_wallet - totalPrice,
      user_id: user.id,
      type: SummTransType.PAYMENT,
      remark: type.get('nama_tipetransaksi'),
    }));
    await DetailTransSummary.create(DetailTransSummary.matchDBColumn({
      transaction_summary_id: summary.serialize().id,
      bucket_id: bucket.id,
    }));
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
      type: 'kode_summarytransaksi',
      remark: 'remark',
    };
    return matchDB(data, column);
  }
}

export const TransSummary = bookshelf.model('TransSummary', transSummaryModel);
export default { TransSummary };
