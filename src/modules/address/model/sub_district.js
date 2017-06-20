import _ from 'lodash';
import core from '../../core';
import './address';

const bookshelf = core.postgres.db;

class SubdistrictModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'kecamatan';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_kecamatan';
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
   * @param {Integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    const address = new this({ address_id: id });
    return await address.save(data);
  }

  /**
   * Get a line item by id
   * @param {Integer} id
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

SubdistrictModel.prototype.serialize = function () {
  return {
    id: parseInt(this.attributes.id_kecamatan, 10),
    name: this.attributes.nama_kecamatan,
  };
};

export const SubDistrict = bookshelf.model('Subdistrict', SubdistrictModel);
export default { SubDistrict };
