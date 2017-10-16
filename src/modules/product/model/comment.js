import core from '../../core';
import { createCommentError } from './../../store/messages';

const bookshelf = core.postgres.db;
const { parseDate, parseNum } = core.utils;

class CommentModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'sub_diskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_subdiskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return ['tgl_subdiskusi'];
  }

  serialize({ minimal = false } = {}) {
    const comment = {
      id: this.get('id_subdiskusi'),
      user_id: !this.relations.user ? this.get('id_subdiskusi') : undefined,
      content: this.get('reply_subdiskusi'),
      created_at: parseDate(this.get('tgl_subdiskusi')),
    };
    if (minimal) {
      return {
        ...comment,
        user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      };
    }
    return {
      ...comment,
      discussion_id: this.get('id_diskusi'),
      is_deleted: !!parseNum(this.get('hapus_subdiskusi')),
      deleted_at: parseDate(this.get('tglhapus_subdiskusi')),
    };
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users');
  }

  /**
   * Add relation to Discussion
   */
  discussion() {
    return this.belongsTo('Discussion', 'id_diskusi');
  }

  /**
   * Get comments by discussion
   */
  static async getByDiscussionId(id, page, pageSize) {
    return await this.where({ id_diskusi: id })
      .orderBy('tgl_subdiskusi', 'DESC')
      .fetchPage({ page, pageSize, withRelated: ['user'] });
  }

  /**
   * Create comment
   */
  static async create(data) {
    return await new this(data).save()
      .then(model => (model.fetch({ withRelated: ['user'] })))
      .catch(() => {
        throw createCommentError('comment', 'error');
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
      discussion_id: 'id_diskusi',
      content: 'reply_subdiskusi',
      is_deleted: 'hapus_subdiskusi',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Comment = bookshelf.model('Comment', CommentModel);
export default { Comment };
