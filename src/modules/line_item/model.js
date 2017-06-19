import core from '../../modules/core';

const bookshelf = core.mysql.db;

export const LineItemType = {
  PRODUCT: 'product',
  COUPON: 'coupon',
};

class LineItemModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'line_item';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'line_item_id';
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
   * Update line item
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const lineItem = new this({ line_item_id: id });
    return await lineItem.save(data);
  }

  /**
   * Get a line item by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ line_item_id: id }).fetch();
  }

  /**
   * Get a line item by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }

  /**
   * Delete a line item by id
   * @param {Integer} id
   */
  static async delete(id) {
    return await new this({ line_item_id: id }).destroy();
  }
}

export const LineItem = LineItemModel;
