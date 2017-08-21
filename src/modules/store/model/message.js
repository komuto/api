import core from '../../core';
import { createMessageError, getMessageError } from './../messages';

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
      store_id: this.relations.store ? undefined : this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }) : undefined,
      user_id: this.get('id_users'),
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

  store() {
    return this.belongsTo('Store', 'id_toko');
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
   * List messages
   * @param id
   * @param type
   * @param isArchived
   */
  static async getById(id, type, isArchived = false) {
    const where = type === 'store' ? { id_toko: id } : { id_users: id };
    const messages = await this.where(where)
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
      .fetchAll({ withRelated: ['store'] });
    return await Promise.all(messages.map(async (message) => {
      await message.load({ detailMessages: qb => qb.limit(1) });
      const detail = message.related('detailMessages').models[0];
      return {
        ...message.serialize(),
        detail_message: detail || {},
      };
    }));
  }

  /**
   * Detail messages
   * @param id
   * @param typeId
   * @param type
   */
  static async findById(id, typeId, type) {
    const where = { id_messages: id };
    if (type === 'store') where.id_toko = typeId;
    else where.id_users = typeId;
    const message = await this.where(where).fetch({ withRelated: ['store', 'detailMessages'] });
    if (!message) throw getMessageError('message', 'not_found');
    return {
      ...message.serialize(),
      detail_messages: message.related('detailMessages'),
    };
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
