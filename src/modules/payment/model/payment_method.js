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
}

export const PaymentMethod = bookshelf.model('PaymentMethod', PaymentMethodModel);
