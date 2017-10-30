import moment from 'moment';
import core from '../../core';
import config from '../../../../config';
import { createMessageError, getMessageError } from './../messages';
import { IMAGE_PATH } from '../../user/model/user';

const bookshelf = core.postgres.db;
const { parseDate, parseNum, matchDB } = core.utils;

export const MessageFlagStatus = {
  READ: 1,
  UNREAD: 2,
  DELETED: 3,
  ARCHIVE: 4,
  PERMANENT_DELETED: 5,
};

export const MessageType = {
  COMPLAINT: 1,
  BUYER_TO_SELLER: 2,
  SELLER_TO_BUYER: 3,
  RESELLER_TO_SELLER: 4,
  SELLER_TO_RESELLER: 5,
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    return {
      id: this.get('id_messages'),
      store_id: this.relations.store ? undefined : this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ message: true }) : undefined,
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

  invoice() {
    return this.belongsTo('Invoice', 'parent_id');
  }

  /**
   * Create message
   * @param data
   */
  static create(data) {
    return new this(data).save().catch(() => {
      throw createMessageError('message', 'error');
    });
  }

  /**
   * List messages
   * @param id
   * @param type
   * @param isArchived
   * @param page
   * @param pageSize
   */
  static async getById(id, type, isArchived = false, page, pageSize) {
    const where = type === 'store' ? { 'messages.id_toko': id } : { 'messages.id_users': id };
    const column = type === 'store' ? 'flagreceiver_messages' : 'flagsender_messages';
    const messages = await this.where(where)
      .query((qb) => {
        qb.select(['*', 'dm.*', 'dm.id_users as d_id_users', 'u.namalengkap_users', 'u.pathfoto_users']);
        qb.joinRaw('join (select DISTINCT ON (id_messages) * FROM detil_messages) as dm ON dm.id_messages = messages.id_messages');
        qb.join('users as u', 'u.id_users', 'dm.id_users');
        qb.whereNotIn(column, [
          MessageFlagStatus.DELETED,
          MessageFlagStatus.PERMANENT_DELETED,
        ]);
        if (isArchived) {
          qb.where(column, MessageFlagStatus.ARCHIVE);
        } else {
          qb.whereNot(column, MessageFlagStatus.ARCHIVE);
        }
        qb.whereNot('group_message', MessageType.COMPLAINT);
      })
      .orderBy(type === 'store' ? 'flagreceiver_date' : 'flagsender_date', 'desc')
      .fetchPage({ page, pageSize, withRelated: ['store', 'invoice'], debug: true });

    return messages.map((message) => {
      const user = {
        id: message.get('d_id_users'),
        name: message.get('namalengkap_users'),
        photo: message.get('pathfoto_users')
          ? core.imagePath(IMAGE_PATH, message.get('pathfoto_users'))
          : config.defaultImage.user,
      };
      const detail = {
        id: message.get('id_detilmessages'),
        message_id: message.get('id_messages'),
        user_id: message.get('d_id_users'),
        user,
        content: message.get('content_messages'),
        status: message.get('status'),
        created_at: parseDate(message.get('date_detilmessages')),
      };
      let invoiceUrl = null;
      const invoiceId = message.related('invoice').get('id_invoice');
      if (invoiceId) {
        // TODO: Generate invoice url from each group_message
        invoiceUrl = invoiceId;
      }
      return {
        ...message.serialize(),
        detail_message: detail || {},
        invoice_url: invoiceUrl,
      };
    });
  }

  /**
   * Detail message
   * @param id
   * @param typeId
   * @param type
   */
  static async findById(id, typeId, type) {
    const where = { id_messages: id };
    const column = type === 'store' ? 'flagreceiver_messages' : 'flagsender_messages';
    if (type === 'store') where.id_toko = typeId;
    else where.id_users = typeId;

    let message = await this.where(where)
      .query((qb) => {
        qb.whereNot(column, MessageFlagStatus.PERMANENT_DELETED);
        qb.whereNot('group_message', MessageType.COMPLAINT);
      })
      .fetch({ withRelated: ['store', 'detailMessages.user'] });
    if (!message) throw getMessageError('message', 'not_found');

    const detailMessages = message.related('detailMessages').map((msg) => {
      msg = msg.serialize();
      const store = message.serialize().store;
      msg.store = (store.user_id === msg.user.id) ? store : null;
      return msg;
    });

    message = message.serialize();
    const flag = type === 'store' ? message.flag_receiver : message.flag_sender;
    message.type = flag === MessageFlagStatus.ARCHIVE ? 'archive' : 'conversation';

    return {
      ...message,
      detail_messages: detailMessages,
    };
  }

  /**
   * Update flag message
   * @param id
   * @param typeId
   * @param type
   * @param flagStatus
   */
  static async updateFlag(id, typeId, type, flagStatus) {
    const where = { id_messages: id };
    if (type === 'store') where.id_toko = typeId;
    else where.id_users = typeId;
    const column = type === 'store' ? 'flagreceiver_messages' : 'flagsender_messages';
    const columnAt = type === 'store' ? 'flagreceiver_date' : 'flagsender_date';
    const message = await this.where(where).fetch();
    if (!message) throw getMessageError('message', 'not_found');
    return await message.save({
      [column]: flagStatus,
      [columnAt]: moment().toDate(),
    }, { patch: true });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      invoice_id: 'id_invoice',
      store_id: 'id_toko',
      user_id: 'id_users',
      subject: 'subject_messages',
      flag_sender: 'flagsender_messages',
      flag_receiver: 'flagreceiver_messages',
      flag_sender_at: 'flagsender_date',
      flag_receiver_at: 'flagreceiver_date',
      type: 'group_message',
      parent_id: 'parent_id',
    };
    return matchDB(data, column);
  }
}

export const Message = bookshelf.model('Message', MessageModel);
export default { Message, MessageFlagStatus };
