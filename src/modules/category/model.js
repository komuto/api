import _ from 'lodash';
import core from '../core';
import { BadRequestError } from '../../../common/errors';
import '../brand/model';

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
   * Add relation to Product
   */
  product() {
    return this.belongsTo('Product', 'id_kategoriproduk', 'id_kategoriproduk');
  }

  /**
   * Add relation to Brand
   */
  brands() {
    return this.hasMany('Brand', 'id_kategoriproduk', 'id_kategoriproduk');
  }

  /**
   * Relation to subcategory
   */
  subcategories() {
    return this.hasMany('Category', 'parentid_kategoriproduk', 'id_kategoriproduk');
  }

  /**
   * Get categories by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }

  /**
   * Get detail categories
   * @param {Object} id
   */
  static async getDetail(id) {
    const results = [];

    const categories = await this.get({ parentid_kategoriproduk: 0 });

    for (const category of categories.models) {
      results.push(category);
    }

    return results;
  }

  /**
   * Get categories and subcategories
   */
  static async getFullCategories() {
    const categories = await this.where({ parentid_kategoriproduk: 0 }).fetchAll({ withRelated: ['subcategories'] });
    if (!categories) throw new BadRequestError('No category found');
    return categories.map((category) => {
      const subCategories = category.related('subcategories');
      return {
        ...category.serialize(),
        sub_categories: subCategories,
      };
    });
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

export default bookshelf.model('Category', CategoryModel);

