import core from '../../core';
import './comment';
import { getDiscussionError, createDiscussionError } from './../messages';
import config from './../../../../config';

const bookshelf = core.postgres.db;
const { parseDate, parseNum, parseDec } = core.utils;

class DiscussionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'diskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_diskusi';
  }

  serialize({ minimal = false } = {}) {
    const discussion = {
      id: this.get('id_diskusi'),
      user_id: !this.relations.user ? this.get('id_users') : undefined,
      user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      question: this.get('pertanyaan_diskusi'),
      created_at: parseDate(this.get('tgl_diskusi')),
    };
    if (minimal) return discussion;
    return {
      ...discussion,
      product_id: this.get('id_produk'),
      is_deleted: !!parseNum(this.get('hapus_diskusi')),
      deleted_at: parseDate(this.get('tglhapus_diskusi')),
    };
  }

  /**
   * Add relation to Comment
   */
  comments() {
    return this.hasMany('Comment', 'id_diskusi');
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users');
  }

  /**
   * Add relation to Product
   */
  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  /**
   * Get discussion by product id
   */
  static async getByProductId(productId, page, pageSize) {
    const discussions = await this.where({ id_produk: productId })
      .orderBy('tgl_diskusi', 'DESC')
      .fetchPage({
        page,
        pageSize,
        withRelated: ['comments', 'user'],
      })
      .catch(() => {
        throw getDiscussionError('discussion', 'not_found');
      });
    return discussions.map((discussion) => {
      const comments = discussion.related('comments');
      return {
        ...discussion.serialize({ minimal: true }),
        count_comments: comments.length,
      };
    });
  }

  /**
   * Create discussion
   */
  static async create(data) {
    return await new this(data).save()
      .then(model => (model.fetch({ withRelated: ['user'] })))
      .catch(() => {
        throw createDiscussionError('discussion', 'error');
      });
  }

  /**
   * Get discussion by user id or product ids
   */
  static async get(data, page, pageSize, isProduct = false) {
    let query = this.where({ id_users: data });
    if (isProduct) query = this.forge().where('id_produk', 'in', data);
    const discussions = await query.orderBy('tgl_diskusi', 'DESC')
      .fetchPage({ page, pageSize, withRelated: ['product'] })
      .catch(() => { throw getDiscussionError('discussion', 'not_found'); });

    return await Promise.all(discussions.map(async (discussion) => {
      let product = discussion.related('product');
      await product.load({ images: qb => qb.limit(1) });
      const image = product.related('images').models[0];
      product = {
        ...product.serialize({ minimal: true }),
        id: parseDec(`${product.get('id_produk')}.${product.get('id_toko')}`),
        image: image ? image.serialize().file : config.defaultImage.product,
      };
      return {
        ...discussion.serialize({ minimal: true }),
        product,
      };
    }));
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
      question: 'pertanyaan_diskusi',
      created_at: 'tgl_diskusi',
      is_deleted: 'hapus_diskusi',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Discussion = bookshelf.model('Discussion', DiscussionModel);
export default { Discussion };
