import core from '../../core';
import { getDiscussionError, createDiscussionError } from './../messages';
import config from './../../../../config';
import { Comment } from './comment';

const bookshelf = core.postgres.db;
const { parseDate, parseNum } = core.utils;

class DiscussionModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'diskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_diskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}, domain) {
    const discussion = {
      id: this.get('id_diskusi'),
      user_id: !this.relations.user ? this.get('id_users') : undefined,
      user: this.relations.user ? this.related('user').serialize({ account: true }, domain) : undefined,
      question: this.get('pertanyaan_diskusi'),
      created_at: parseDate(this.get('tgl_diskusi')),
    };
    if (minimal) return discussion;
    return {
      ...discussion,
      product_id: this.get('id_produk'),
      store_id: parseNum(this.get('id_toko')),
      dropshipper_id: parseNum(this.get('id_dropshipper')),
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
   * Add relation to Store
   */
  store() {
    return this.belongsTo('Store', 'id_toko');
  }

  /**
   * Get discussion by product id
   */
  static async getByProductId(productId, storeId, page, pageSize, domain) {
    const discussions = await this
      .where({ id_produk: productId, id_toko: storeId })
      .orderBy('tgl_diskusi', 'DESC')
      .fetchPage({ page, pageSize, withRelated: 'user' });

    return await Promise.all(discussions.map(async (discussion) => {
      const countComment = await Comment.where({ id_diskusi: discussion.id }).count();
      return {
        ...discussion.serialize({ minimal: true }, domain),
        count_comments: parseNum(countComment),
      };
    }));
  }

  /**
   * Create discussion
   */
  static create(data) {
    return new this(data).save()
      .then(model => (model.fetch({ withRelated: ['user'] })))
      .catch(() => {
        throw createDiscussionError('discussion', 'error');
      });
  }

  /**
   * Get discussion by user id or store id
   */
  static async getByQuery(where, page, pageSize) {
    const discussions = await this
      .where(where)
      .orderBy('tgl_diskusi', 'desc')
      .fetchPage({ page, pageSize, withRelated: ['product.image'] })
      .catch(() => { throw getDiscussionError('discussion', 'not_found'); });

    return discussions.map((discussion) => {
      let product = discussion.related('product');
      const image = product.related('image');
      product = {
        ...product.serialize({ minimal: true }),
        id: `${product.get('id_produk')}.${product.get('id_toko')}`,
        image: image ? image.serialize().file : config.defaultImage.product,
      };
      return {
        ...discussion.serialize({ minimal: true }),
        product,
      };
    });
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
      store_id: 'id_toko',
      dropshipper_id: 'id_dropshipper',
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
