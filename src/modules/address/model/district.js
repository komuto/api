import _ from 'lodash';
import toTitleCase from 'to-title-case';
import core from '../../core';

const bookshelf = core.postgres.db;

class DistrictModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'kota_kab';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_kotakab';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_kotakab'),
      ro_id: this.get('id_ro'),
      name: toTitleCase(this.get('nama_kotakab')),
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
   * @param {String} query
   */
  static get(condition = null, query = null) {
    condition = _.pickBy(condition, _.identity);
    return this.where(condition)
      .query((qb) => {
        if (query) {
          qb.whereRaw('LOWER(nama_kotakab) LIKE ?', `%${query.toLowerCase()}%`).limit(9);
        }
      })
      .fetchAll();
  }
}

export const District = bookshelf.model('District', DistrictModel);
export default { District };
