import core from '../core';

const bookshelf = core.mysql.db;

class PaymentModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'payment_confirmation';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'payment_confirmation_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    const lineItem = new this(data);
    return await lineItem.save();
  }

  /**
   * Get a line item by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ payment_confirmation_id: id }).fetch();
  }

  /**
   * Get a line item by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }
}

// eslint-disable-next-line import/prefer-default-export
export const Payment = PaymentModel;
