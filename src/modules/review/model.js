import moment from 'moment';
import core from '../core';
import '../user/model/user';
import '../product/model/product';

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

  user() {
    return this.belongsTo('User', 'id_users');
  }

  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  /**
   * Create a new line item
   * @param {Object} data
   */
  static async create(data) {
    data.tgl_ulasanproduk = moment();
    return await new this(data).save();
  }

  /**
   * Get a line item by id other than primary id
   * @param userId {Integer}
   * @param productId {integer}
   */
  static async getByOtherId(userId, productId) {
    return await this.where({ id_users: userId, id_produk: productId }).fetch();
  }

  /**
   * Get a line item by id
   * @param id {Integer}
   */
  static async getById(id) {
    const review = await this.where({ id_ulasanproduk: id }).fetch({ withRelated: ['user'] });
    const { id: userId, name, photo } = review.related('user').serialize();
    return {
      ...review.serialize(true),
      user: { id: userId, name, photo },
    };
  }

  /**
   * Get a line item by condition
   * @param data {Object}
   * @param {Integer} pageSize limit
   * @param {Integer} page
   */
  static async getAll(data, { pageSize, page }) {
    const withRelated = ['user'];
    const reviews = await this.query((qb) => {
      if (data.store_id) {
        qb.innerJoin('produk', 'produk.id_produk', 'ulasan_produk.id_produk');
        qb.where('id_toko', data.store_id);
      }
      if (data.q) qb.whereRaw('LOWER(isi_ulasanproduk) LIKE ?', `%${data.q.toLowerCase()}%`);
      if (data.product_id) qb.where('ulasan_produk.id_produk', data.product_id);
      if (data.user_id) qb.where('ulasan_produk.id_users', data.user_id);
    }).orderBy('-id_ulasanproduk')
      .fetchPage({ pageSize, page, withRelated });
    const { pageSize: limit, rowCount: total, pageCount: pages } = reviews.pagination;
    const models = reviews.models.map((review) => {
      const { name, id, photo } = review.related('user').serialize();
      return {
        ...review.serialize(data.getProductId),
        user: { id, name, photo },
      };
    });
    return {
      pagination: { page: reviews.pagination.page, limit, total, pages },
      models,
    };
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

ReviewModel.prototype.serialize = function (full = false) {
  const review = {
    id: this.attributes.id_ulasanproduk,
    review: this.attributes.isi_ulasanproduk,
    quality: parseInt(this.attributes.kualitasproduk, 10),
    accuracy: parseInt(this.attributes.akurasiproduk, 10),
    created_at: moment(this.attributes.tgl_ulasanproduk).unix(),
  };
  if (full) review.product_id = this.attributes.id_produk;
  return review;
};

export const Review = bookshelf.model('Review', ReviewModel);
export default { Review };
