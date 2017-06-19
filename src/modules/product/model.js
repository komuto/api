import core from '../../modules/core';

const bookshelf = core.mysql.db;

export const ProductStatus = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
};

class ProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'product';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'product_id';
  }
  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return true;
  }

  /**
   * Update product
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const product = new this({ product_id: id });
    return await product.save(data);
  }

  /**
   * Get a product by id
   * @param {Integer} id
   */
  static async getById(id) {
    return await this.where({ product_id: id }).fetch();
  }

  /**
   * Get a product by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    return await this.where(condition).fetchAll();
  }
}

export const Product = ProductModel;
