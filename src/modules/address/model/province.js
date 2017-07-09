import _ from 'lodash';
import toTitleCase from 'to-title-case';
import core from '../../core';

const bookshelf = core.postgres.db;

class ProvinceModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'provinsi';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_provinsi';
  }

  address() {
    return this.hasMany('Address');
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    const address = new this(data);
    return await address.save();
  }

  /**
   * Update line item
   * @param {integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const address = new this({ address_id: id });
    return await address.save(data);
  }

  /**
   * Get a line item by id
   * @param {integer} id
   */
  static async getById(id) {
    return await this.where({ address_id: id }).fetch();
  }

  /**
   * Get a line item by condition
   * @param {Object} condition
   */
  static async get(condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchAll();
  }
}

ProvinceModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_provinsi,
    name: toTitleCase(this.attributes.nama_provinsi),
  };
};

export const Province = bookshelf.model('Province', ProvinceModel);
export default { Province };

