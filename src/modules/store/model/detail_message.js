import core from '../../core';
import { createCommentError } from './../messages';

const bookshelf = core.postgres.db;
const { parseDate } = core.utils;

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
      message_id: this.get('id_messages'),
      user_id: this.get('id_users'),
      content: this.get('content_messages'),
      created_at: parseDate(this.get('date_detilmessages')),
    };
  }

  /**
   * Crate detail message
   * @param data
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
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
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const DetailMessage = bookshelf.model('DetailMessage', DetailMessageModel);
export default { DetailMessage };
