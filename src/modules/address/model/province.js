import core from '../../core';
import './address';

const bookshelf = core.mysql.db;

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
    return await this.where(condition).fetchAll();
  }
}

ProvinceModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_provinsi,
    name: this.attributes.nama_provinsi,
  };
};

// eslint-disable-next-line import/prefer-default-export
export const Province = ProvinceModel;
export default bookshelf.model('Province', ProvinceModel);
