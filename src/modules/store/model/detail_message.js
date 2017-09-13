import core from '../../core';
import { createCommentError } from './../messages';

const bookshelf = core.postgres.db;
const { parseDate, parseNum, matchDB } = core.utils;

class DetailMessageModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'detil_messages';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_detilmessages';
  }

  serialize() {
    return {
      id: this.get('id_detilmessages'),
      message_id: parseNum(this.get('id_messages')),
      user_id: this.relations.user ? undefined : this.get('id_users'),
      user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      content: this.get('content_messages'),
      created_at: parseDate(this.get('date_detilmessages')),
    };
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  /**
   * Crate detail message
   * @param data
   */
  static async create(data) {
    return await new this(data).save().catch((e) => {
      console.log(e);
      throw createCommentError('comment', 'error');
    });
  }

  static matchDBColumn(data) {
    const column = {
      message_id: 'id_messages',
      user_id: 'id_users',
      content: 'content_messages',
      created_at: 'date_detilmessages',
    };
    return matchDB(data, column);
  }
}

export const DetailMessage = bookshelf.model('DetailMessage', DetailMessageModel);
export default { DetailMessage };
