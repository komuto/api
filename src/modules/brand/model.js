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
  };
};

// eslint-disable-next-line import/prefer-default-export
export const Brand = BrandModel;
