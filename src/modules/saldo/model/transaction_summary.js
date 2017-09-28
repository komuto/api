import moment from 'moment';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';
import { PromoType } from '../../bucket/model';
import { User } from '../../user/model';
import { TransType } from './transaction_type';
import { DetailTransSummary } from './detail_transaction_summary';
import { getHistoryError } from '../messages';

const { matchDB, parseNum, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const SummTransType = {
  PAYMENT: 'PAID',
  REFUND: 'RFND',
  SELLING: 'SELL',
  FEE: 'SFEE',
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
      amount: parseNum(this.get('nominal_summarytransaksi')),
      trans_type: this.get('kode_summarytransaksi'),
      date: parseDate(this.get('tgl_summarytransaksi')),
      user_id: parseNum(this.get('id_users')),
      first_saldo: parseNum(this.get('saldo_awal')),
      last_saldo: parseNum(this.get('saldo_akhir')),
      remark: this.get('remark'),
    };
  }

  /**
   * Add relation to DetailTransSummary
   */
  detailTransSummary() {
    return this.hasOne('DetailTransSummary', 'id_summarytransaksi', 'id_summarytransaksi');
  }

  summaryable() {
    return this.morphTo('summaryable', 'Bucket', 'Invoice', 'Withdraw', 'Topup', 'Refund');
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

  static async get(userId, params, page, pageSize) {
    const { filters } = params;
    let { start_at: startAt, end_at: endAt } = params;
    startAt = moment.unix(startAt);
    endAt = moment.unix(endAt);
    if (!startAt.isValid() || !endAt.isValid()) {
      throw getHistoryError('date', 'invalid_date');
    }
    const transactions = await this.where('id_users', userId)
      .query((qb) => {
        if (filters) qb.whereIn('kode_summarytransaksi', filters);
        if (startAt) qb.where('tgl_summarytransaksi', '>=', startAt);
        if (endAt) qb.where('tgl_summarytransaksi', '<', endAt);
      })
      .fetchPage({ page, pageSize, withRelated: 'detailTransSummary' });
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

    return totalPrice;
  }

  static async cutSaldo(user, totalPrice, bucket) {
    await User.updateWallet(user.id, user.saldo_wallet - totalPrice);
    const remark = await TransType.getRemark(SummTransType.PAYMENT);
    await this.create(this.matchDBColumn({
      amount: totalPrice,
      first_saldo: user.saldo_wallet,
      last_saldo: user.saldo_wallet - totalPrice,
      user_id: user.id,
      type: SummTransType.PAYMENT,
      remark,
      summaryable_type: 'bucket',
      summaryable_id: bucket.id,
    }));
  }

  /**
   * @param id {int} store id
   */
  async getSellingDetail(id) {
    await this.load('summaryable.items.product.image');
    let invoice = this.related('summaryable');
    const isReseller = invoice.get('id_toko') !== id;
    const getBuyer = invoice.load('buyer');
    const items = invoice.related('items').map((item) => {
      const product = item.related('product').serialize({ minimal: true });
      item = item.serialize({ minimal: true, note: true });
      return { item, product };
    });
    const transaction = this.serialize();
    const totalBill = Number(invoice.get('total_tagihan'));
    let nominal;
    let percent;
    if (!isReseller) {
      nominal = totalBill - transaction.amount;
      percent = (nominal / totalBill) * 100;
      transaction.type = 'seller';
    } else {
      nominal = transaction.amount;
      percent = (nominal / totalBill) * 100;
      transaction.type = 'reseller';
    }
    await getBuyer;
    const buyer = invoice.related('buyer').serialize({ orderDetail: true });
    invoice = { ...invoice.serialize({ orderDetail: true }), items };
    return { transaction, commission: { nominal, percent }, buyer, invoice };
  }

  async getPaymentDetail() {
    await this.load(['summaryable.promo',
      'summaryable.invoices.shipping.address',
      'summaryable.invoices.items.product.image']);
    const bucket = this.related('summaryable');
    const invoices = bucket.related('invoices');
    const getRelations = { address: [], store: [], expedition: [] };
    const items = invoices.map((invoice) => {
      // eager load other relations
      const shipping = invoice.related('shipping');
      const getFullAddress = shipping.related('address').load(['province', 'district', 'subDistrict', 'village']);
      getRelations.address.push(getFullAddress);
      getRelations.store.push(invoice.load('store'));
      getRelations.expedition.push(shipping.load('expeditionService.expedition'));
      return invoice.related('items').map((item) => {
        const product = item.related('product').serialize({ minimal: true });
        item = item.serialize({ minimal: true, note: true });
        return { item, product };
      });
    });
    const orders = await Promise.all(invoices.map(async (invoice, idx) => {
      const { address, store, expedition } = getRelations;
      await Promise.all([address[idx], store[idx], expedition[idx]]);
      return {
        invoice: invoice.serialize({ minimal: true, shippingMin: true }),
        items: items[idx],
      };
    }));
    return { transaction: this.serialize(), bucket: bucket.serialize(), orders };
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
      summaryable_type: 'summaryable_type',
      summaryable_id: 'summaryable_id',
    };
    return matchDB(data, column);
  }
}

export const TransSummary = bookshelf.model('TransSummary', transSummaryModel);
export default { TransSummary };
