import _ from 'lodash';
import toTitleCase from 'to-title-case';
import core from '../../core';

const bookshelf = core.postgres.db;

class VillageModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'kelurahan';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_kelurahan';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: parseInt(this.get('id_kelurahan'), 10),
      name: toTitleCase(this.get('nama_kelurahan')),
    };
  }

  address() {
    return this.hasMany('Address');
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    return new this(data).save();
  }

  /**
   * Update line item
   * @param {integer} id
   * @param {Object} data
   */
  static async update(id, data) {
    return new this({ address_id: id }).save(data);
  }

  /**
   * Get a line item by id
   * @param {integer} id
   */
  static getById(id) {
    return this.where({ address_id: id }).fetch();
  }

  /**
   * Get a line item by condition
   * @param {Object} condition
   */
  static get(condition = null) {
    condition = _.pickBy(condition, _.identity);
    return this.where(condition).fetchAll();
  }
}

export const Village = bookshelf.model('Village', VillageModel);
export default { Village };
