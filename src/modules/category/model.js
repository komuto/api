import _ from 'lodash';
import slug from 'slug';
import core from '../core';
import { getCategoryError } from './messages';

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

  serialize() {
    return {
      id: this.get('id_kategoriproduk'),
      parent_id: this.get('parentid_kategoriproduk'),
      icon: core.categoryPath(this.get('iconpath_kategoriproduk')),
      name: this.get('nama_kategoriproduk'),
      slug: slug(this.get('nama_kategoriproduk'), { lower: true, charmap: '' }),
    };
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

  async parents() {
    let category = this;
    const name = category.serialize().name;
    let parents = [];

    while (category.serialize().parent_id) {
      const parentId = category.serialize().parent_id;
      category = await CategoryModel.where('id_kategoriproduk', parentId).fetch();

      if (category) {
        parents.push(category.serialize());
      }
    }

    parents = parents.reverse();
    const names = _.reduce(parents, (res, parent) => (res += `${parent.name} / `), '');

    return { name: names + name, parents };
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
   * Get categories and subcategories
   */
  static async getDetailCategories(id) {
    const category = await this.where({ id_kategoriproduk: id }).fetch({ withRelated: ['subcategories'] });
    if (!category) throw getCategoryError('category', 'not_found');
    const subCategories = category.related('subcategories');
    return {
      ...category.serialize(),
      sub_categories: subCategories,
    };
  }

  /**
   * Get categories and subcategories
   */
  static async getFullCategories() {
    const categories = await this.where({ parentid_kategoriproduk: 0 }).fetchAll({ withRelated: ['subcategories'] });
    if (!categories) throw getCategoryError('category', 'not_found');
    return categories.map((category) => {
      const subCategories = category.related('subcategories');
      return {
        ...category.serialize(),
        sub_categories: subCategories,
      };
    });
  }
}

export default bookshelf.model('Category', CategoryModel);

