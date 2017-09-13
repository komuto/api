import core from '../../core';
import config from '../../../../config';
import { createDisputeError, getDisputeError } from '../messages';
import { Message, MessageFlagStatus, MessageType } from '../../store/model/message';
import { DetailMessage } from '../../store/model/detail_message';

const { parseDate, matchDB, parseNum } = core.utils;
const bookshelf = core.postgres.db;

export const DisputeSolutionType = {
  REFUND: 1,
  EXCHANGE: 2,
};

export const DisputeResponseStatus = {
  NO_RESPONSE_YET: 0,
  BUYER_WIN: 1,
  SELLER_WIN: 2,
};

export const DisputeStatus = {
  NEW: 1,
  READ_BY_USER: 2,
  SEND_BY_BUYER: 3,
  RECEIVE_BY_SELLER: 4,
  SEND_BY_SELLER: 5,
  RECEIVE_BY_USER: 6,
  PROCESS_OF_REFUND: 7,
  CLOSED: 8,
};

class DisputeModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'dispute';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_dispute';
  }

  serialize() {
    return {
      id: this.get('id_dispute'),
      user_id: this.get('id_users'),
      user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      store_id: this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }) : undefined,
      invoice_id: this.get('identifierinvoice_dispute'),
      invoice: this.relations.invoice ? this.related('invoice') : undefined,
      solution: parseNum(this.get('solusi_dispute')),
      problems: this.getProblems(),
      note: this.get('alasan_dispute'),
      dispute_number: this.get('nopelaporan_dispute'),
      remarks: this.get('remarksresult_dispute'),
      status: this.get('status_dispute'),
      response_status: parseNum(this.get('responadmin_dispute')),
      response_at: parseDate(this.get('tglresponadmin_dispute')),
      created_at: parseDate(this.get('createdate_dispute')),
    };
  }

  disputeProducts() {
    return this.hasMany('DisputeProduct', 'id_dispute');
  }

  store() {
    return this.belongsTo('Store', 'id_toko');
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  invoice() {
    return this.belongsTo('Invoice', 'identifierinvoice_dispute');
  }

  imageGroups() {
    return this.hasMany('ImageGroup', 'parent_id');
  }

  message() {
    return this.morphOne('Message', 'group', ['group_message', 'parent_id'], 1);
  }

  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createDisputeError('dispute', 'error');
    });
  }

  getProblems() {
    let problems = '';
    this.get('problem_dispute').forEach((val, key) => {
      if (key !== 0) problems += ', ';
      switch (val.problem) {
        case 1:
          problems += 'Barang tidak sesuai deskripsi';
          break;
        case 2:
          problems += 'Barang rusak';
          break;
        case 3:
          problems += 'Produk tidak lengkap';
          break;
        case 4:
          problems += 'Kurir pengiriman berbeda';
          break;
        default:
          break;
      }
    });
    return problems;
  }

  static async getAll(params) {
    const { where, relation, is_resolved: isResolved, page, pageSize } = params;
    const disputes = await this.where(where)
      .query((qb) => {
        if (isResolved) qb.whereNot('responadmin_dispute', DisputeResponseStatus.NO_RESPONSE_YET);
        else qb.where('responadmin_dispute', DisputeResponseStatus.NO_RESPONSE_YET);
      })
      .fetchPage({
        page,
        pageSize,
        withRelated: ['disputeProducts.product.images', relation],
      });

    return disputes.map(dispute => this.detailDispute(dispute));
  }

  static async getDetail(where, relation) {
    const dispute = await this.where(where).fetch({
      withRelated: [
        'disputeProducts.product.images',
        'invoice',
        relation,
        { imageGroups: qb => qb.where('group', 'dispute') },
        'message.store',
        'message.detailMessages.user',
      ],
    });

    if (!dispute) throw getDisputeError('dispute', 'not_found');

    const message = dispute.related('message');
    const discussions = message.related('detailMessages').map((msg) => {
      msg = msg.serialize();
      const store = message.serialize().store;
      msg.store = (store.user_id === msg.user.id) ? store : null;
      return msg;
    });

    return {
      ...this.detailDispute(dispute),
      proofs: dispute.related('imageGroups'),
      discussions,
    };
  }

  static detailDispute(dispute) {
    const products = dispute.related('disputeProducts').map((val) => {
      const product = val.related('product');
      const image = product.related('images').models;
      return {
        ...product.serialize({ minimal: true }),
        image: image.length ? image[0].serialize().file : config.defaultImage.product,
      };
    });
    return {
      ...dispute.serialize(),
      products,
    };
  }

  static async createDiscussion(where, userId, content) {
    const dispute = await this.where(where).fetch({ withRelated: ['message'] });
    if (!dispute) throw getDisputeError('dispute', 'not_found');

    let messageId;
    const message = dispute.related('message');
    if (!message.serialize().id) {
      const messageObj = Message.matchDBColumn({
        user_id: dispute.serialize().user_id,
        store_id: dispute.serialize().store_id,
        subject: '',
        flag_sender: MessageFlagStatus.UNREAD,
        flag_receiver: MessageFlagStatus.UNREAD,
        flag_sender_at: new Date(),
        flag_receiver_at: new Date(),
        type: MessageType.COMPLAINT,
        parent_id: dispute.serialize().id,
      });
      const newMessage = await Message.create(messageObj);
      messageId = newMessage.serialize().id;
    } else {
      messageId = message.serialize().id;
    }
    const detailMessageObj = DetailMessage.matchDBColumn({
      message_id: messageId,
      user_id: userId,
      content,
      created_at: new Date(),
    });
    return await DetailMessage.create(detailMessageObj);
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    data = { ...data, path: '' };
    const column = {
      user_id: 'id_users',
      store_id: 'id_toko',
      invoice_id: 'identifierinvoice_dispute',
      invoice_type: 'tipeinvoice_dispute',
      solution: 'solusi_dispute',
      problems: 'problem_dispute',
      note: 'alasan_dispute',
      dispute_number: 'nopelaporan_dispute',
      remarks: 'remarksresult_dispute',
      status: 'status_dispute',
      response_status: 'responadmin_dispute',
      response_at: 'tglresponadmin_dispute',
      created_at: 'createdate_dispute',
      path: 'pathpic_dispute',
    };
    return matchDB(data, column);
  }
}

export const Dispute = bookshelf.model('Dispute', DisputeModel);
