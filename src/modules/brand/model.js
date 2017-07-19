import _ from 'lodash';
import core from '../core';

const bookshelf = core.postgres.db;

class BrandModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'brands';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_brand';
  }

  serialize() {
    return {
      id: this.get('id_brand'),
      category_id: this.get('id_kategoriproduk'),
      name: this.get('nama_brand'),
      is_checked: false,
    };
  }

  /**
   * Add relation to Category
   */
  category() {
    return this.belongsTo('Category', 'id_kategoriproduk', 'id_kategoriproduk');
  }

  /**
   * Get brands by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }
}

export const Brand = bookshelf.model('Brand', BrandModel);
export default { Brand };
