import core from '../../modules/core';

const bookshelf = core.mysql.db;

export const CouponStatus = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
};

export const CouponType = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
};

class CouponModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'coupon';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'coupon_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  /**
   * Update coupon
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const coupon = new this({ coupon_id: id });
    return await coupon.save(data);
  }

  /**
   * Get a coupon by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ coupon_id: id }).fetch();
  }

  /**
   * Get a coupon by coupon code
   * @param {String} code
   */
  static async getByCode(code) {
    return await this.where({ code }).fetch();
  }

  /**
   * Get a coupon by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }

  /**
   * Delete a coupon by id
   * @param {Integer} id
   */
  static async delete(id) {
    return await new this({ coupon_id: id }).destroy();
  }
}

export const Coupon = CouponModel;
