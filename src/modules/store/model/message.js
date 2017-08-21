import core from '../../core';
import { createMessageError } from './../messages';

const bookshelf = core.postgres.db;
const { parseDate, parseNum } = core.utils;

export const MessageFlagStatus = {
  READ: 1,
  UNREAD: 2,
  DELETED: 3,
  ARCHIVE: 4,
  PERMANENT_DELETED: 5,
};

class MessageModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'messages';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_messages';
  }

  serialize() {
    return {
      id: this.get('id_messages'),
      store_id: this.get('id_toko'),
      user_id: this.relations.user ? undefined : this.get('id_users'),
      user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      subject: this.get('subject_messages'),
      flag_sender: parseNum(this.get('flagsender_messages')),
      flag_receiver: parseNum(this.get('flagreceiver_messages')),
      flag_sender_at: parseDate(this.get('flagsender_date')),
      flag_receiver_at: parseDate(this.get('flagreceiver_date')),
    };
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  detailMessages() {
    return this.hasMany('DetailMessage', 'id_messages');
  }

  /**
   * Create message
   * @param data
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createMessageError('message', 'error');
    });
  }

  /**
   * Create message
   * @param storeId
   * @param isArchived
   */
  static async findByStoreId(storeId, isArchived = false) {
    const messages = await this.where({ id_toko: storeId })
      .query((qb) => {
        qb.whereNotIn('flagreceiver_messages', [
          MessageFlagStatus.DELETED,
          MessageFlagStatus.PERMANENT_DELETED,
        ]);
        if (isArchived) {
          qb.where('flagreceiver_messages', MessageFlagStatus.ARCHIVE);
        } else {
          qb.whereNot('flagreceiver_messages', MessageFlagStatus.ARCHIVE);
        }
      })
      .fetchAll({ withRelated: ['user'] });
    return await Promise.all(messages.map(async (message) => {
      await message.load({ detailMessages: qb => qb.limit(1) });
      return {
        ...message.serialize(),
        detail_message: message.related('detailMessages').models[0],
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
      store_id: 'id_toko',
      user_id: 'id_users',
      subject: 'subject_messages',
      flag_sender: 'flagsender_messages',
      flag_receiver: 'flagreceiver_messages',
      flag_sender_at: 'flagsender_date',
      flag_receiver_at: 'flagreceiver_date',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Message = bookshelf.model('Message', MessageModel);
export default { Message, MessageFlagStatus };
