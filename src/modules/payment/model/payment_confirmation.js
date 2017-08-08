import core from '../../core';
import config from '../../../../config';
import { createPaymentConfirmationError, getPaymentConfirmationError } from './../messages';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.payment;

export const PaymentConfirmationStatus = {
  0: 'DRAFT',
  1: 'APPROVE',
  2: 'REJECT',
};

class PaymentConfirmationModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'payment_confirmation';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: parseNum(this.get('id')),
      user_id: this.get('id_users'),
      bucket_id: this.get('id_bucket'),
      bank_account_id: this.get('id_rekeninguser'),
      date: parseDate(this.get('tanggal')),
      amount: this.get('amount'),
      bank: this.get('bank_pengirim'),
      holder_account_number: this.get('rekening_pengirim'),
      status: this.get('status'),
      attachment: core.imagePath(IMAGE_PATH, this.get('attachment')),
    };
  }

  /**
   * Create payment confirmation
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createPaymentConfirmationError('payment_confirmation', 'error');
    });
  }

  /**
   * Create payment confirmation
   */
  static async checkDuplicate(bucketId) {
    const paymentConfirmation = await this.where({ id_bucket: bucketId }).fetch();
    if (paymentConfirmation) throw getPaymentConfirmationError('payment_confirmation', 'duplicate');
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      bucket_id: 'id_bucket',
      bank_account_id: 'id_rekeninguser',
      date: 'tanggal',
      amount: 'amount',
      bank: 'bank_pengirim',
      holder_account_number: 'rekening_pengirim',
      status: 'status',
      attachment: 'attachment',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const PaymentConfirmation = bookshelf.model('PaymentConfirmation', PaymentConfirmationModel);
