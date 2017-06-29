import _ from 'lodash';
import moment from 'moment';
import core from '../../core';

const bookshelf = core.postgres.db;

class ReviewModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'ulasan_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ulasanproduk';
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    data.tgl_ulasanproduk = moment();
    const review = await new this(data).save();
    return review;
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

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      product_id: 'id_produk',
      created_at: 'tgl_ulasanproduk',
      review: 'isi_ulasanproduk',
      quality: 'kualitasproduk',
      accuracy: 'akurasiproduk',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

// ReviewModel.prototype.serialize = function () {
//   return {
//     id: this.attributes.id_kotakab,
//     ro_id: this.attributes.id_ro,
//     name: this.attributes.nama_kotakab,
//   };
// };

export const Review = bookshelf.model('Review', ReviewModel);
export default { Review };
