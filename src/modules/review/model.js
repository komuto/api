import moment from 'moment';
import core from '../core';
import { createReviewError } from './messages';
import config from '../../../config';

const bookshelf = core.postgres.db;
const { parseNum, parseDate } = core.utils;

class ReviewModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'ulasan_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ulasanproduk';
  }

  serialize({ minimal = true } = {}) {
    const review = {
      id: this.get('id_ulasanproduk'),
      review: this.get('isi_ulasanproduk'),
      quality: parseNum(this.get('kualitasproduk')),
      accuracy: parseNum(this.get('akurasiproduk')),
      created_at: parseDate(this.get('tgl_ulasanproduk')),
    };
    if (!minimal) review.product_id = this.get('id_produk');
    return review;
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
    return await new this(data).save().catch(() => {
      throw createReviewError('review', 'error');
    });
  }

  /**
   * Get a line item by id other than primary id
   * @param userId {integer}
   * @param productId {integer}
   */
  static async getByOtherId(userId, productId) {
    return await this.where({ id_users: userId, id_produk: productId }).fetch();
  }

  /**
   * Get a line item by condition
   * @param data {Object}
   * @param {integer} pageSize limit
   * @param {integer} page
   * @param {boolean} withProduct
   */
  static async getAll(data, { pageSize, page }, withProduct = false) {
    const withRelated = ['user'];
    if (withProduct) withRelated.push('product.store');
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
    const models = await Promise.all(reviews.models.map(async (review) => {
      const { id, name, photo } = review.related('user').serialize();
      if (withProduct) {
        const product = review.related('product');
        const { id: pId, name: pName } = product.serialize();
        const store = product.related('store').serialize({ favorite: true });
        await product.load({ images: qb => qb.limit(1) });
        let image = product.related('images').models[0];
        image = image ? image.serialize() : config.defaultImage.product;
        return {
          ...review.serialize(),
          product: { id: pId, name: pName, image: image.file, store },
          user: { id, name, photo },
        };
      }
      return {
        ...review.serialize({ minimal: false }),
        user: { id, name, photo },
      };
    }));
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

export const Review = bookshelf.model('Review', ReviewModel);
export default { Review };
