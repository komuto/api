import _ from 'lodash';
import core from '../core';

const bookshelf = core.postgres.db;

class CategoryModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'kategori_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_kategoriproduk';
  }

  /**
   * Get categories by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }
}

CategoryModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_kategoriproduk,
    parent_id: this.attributes.parentid_kategoriproduk,
    icon: this.attributes.iconpath_kategoriproduk,
    name: this.attributes.nama_kategoriproduk,
  };
};

export const Category = CategoryModel;
export default bookshelf.model('Category', CategoryModel);

