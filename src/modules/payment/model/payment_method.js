import core from '../../core';
import config from '../../../../config';

const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.payment;

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
      type: this.get('type_paymentmethod'),
      type_text: this.get('type_text'),
      status: this.get('status_paymentmethod'),
      status_at: this.get('tglstatus_paymentmethod'),
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
}

export const PaymentMethod = bookshelf.model('PaymentMethod', PaymentMethodModel);
