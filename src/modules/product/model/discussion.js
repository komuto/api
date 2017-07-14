import core from '../../core';
import './comment';
import { BadRequestError } from '../../../../common/errors';

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

  serialize(minimal = false) {
    if (minimal) {
      return {
        id: this.get('id_diskusi'),
        user_id: !this.relations.user ? this.get('id_users') : undefined,
        user: this.relations.user ? this.related('user').serialize(false, false, true) : undefined,
        question: this.get('pertanyaan_diskusi'),
        created_at: parseDate(this.get('tgl_diskusi')),
      };
    }
    return {
      id: this.get('id_diskusi'),
      user_id: !this.relations.user ? this.get('id_users') : undefined,
      user: this.relations.user ? this.related('user').serialize(false, false, true) : undefined,
      product_id: this.get('id_produk'),
      question: this.get('pertanyaan_diskusi'),
      created_at: parseDate(this.get('tgl_diskusi')),
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
        throw new BadRequestError('No Product Found');
      });
    return discussions.map((discussion) => {
      const comments = discussion.related('comments');
      return {
        ...discussion.serialize(true),
        count_comments: comments.length,
      };
    });
  }

  /**
   * Create discussion
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw new BadRequestError('Gagal menambah diskusi.');
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
