import _ from 'lodash';
import core from '../core';
import '../category/model';

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

BrandModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_brand,
    category_id: this.attributes.id_kategoriproduk,
    name: this.attributes.nama_brand,
    is_checked: null,
  };
};

export default bookshelf.model('Brand', BrandModel);
