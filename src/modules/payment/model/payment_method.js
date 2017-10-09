import core from '../../core';
import config from '../../../../config';
import { getPaymentError } from './../messages';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.payment_method;

export const PaymentMethodStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

export const PaymentMethodType = {
  MANUAL: 0,
  THIRD_PARTY: 1,
  SALDO: 2,
};

class PaymentMethodModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'payment_method';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_paymentmethod';
  }

  serialize() {
    return {
      id: this.get('id_paymentmethod'),
      name: this.get('nama_paymentmethod'),
      remarks: this.get('remarks_paymentmethod'),
      logo: core.imagePath(IMAGE_PATH, this.get('logo_paymentmethod')),
      type: parseNum(this.get('type_paymentmethod')),
      type_text: this.get('type_text'),
      status: parseNum(this.get('status_paymentmethod')),
      status_at: parseDate(this.get('tglstatus_paymentmethod')),
    };
  }

  /**
   * Get all payment methods
   */
  static async getAll() {
    return await this.where({ status_paymentmethod: PaymentMethodStatus.ACTIVE })
      .orderBy('id_paymentmethod')
      .fetchAll();
  }

  /**
   * Find by id
   */
  static async findById(id) {
    const paymentMethod = await this.where({ id_paymentmethod: id }).fetch().catch(() => {
      throw getPaymentError('payment_method', 'not_found');
    });
    if (!paymentMethod) throw getPaymentError('payment_method', 'not_found');
    return paymentMethod;
  }

  static async findByType(type) {
    const paymentMethod = await this.where({ type_text: type }).fetch();
    return paymentMethod.id;
  }

  static async getMidtransPaymentMethod(type) {
    const matchType = {
      credit_card: 'credit_card-midtrans',
      bank_transfer: 'bank_transfer-midtrans',
      bca_klikpay: 'bca_klikpay-midtrans',
      bca_klikbca: 'bca_klikbca-midtrans',
      mandiri_clickpay: 'mandiri_clickpay-midtrans',
      bri_epay: 'bri_epay-midtrans',
      cimb_clicks: 'cimb_clicks-midtrans',
      danamon_online: 'danamon_online-midtrans',
      telkomsel_cash: 'telkomsel_cash-midtrans',
      xl_tunai: 'xl_tunai-midtrans',
      indosat_dompetku: 'indosat_dompetku-midtrans',
      mandiri_ecash: 'mandiri_ecash-midtrans',
      cstore: 'cstore-midtrans',
    };

    return matchType[type] ? await this.findByType(matchType[type]) : null;
  }
}

export const PaymentMethod = bookshelf.model('PaymentMethod', PaymentMethodModel);
