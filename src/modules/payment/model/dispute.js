import _ from 'lodash';
import moment from 'moment';
import core from '../../core';
import config from '../../../../config';
import { createDisputeError, getDisputeError } from '../messages';
import { Message, MessageFlagStatus, MessageType } from '../../store/model/message';
import { DetailMessage, DetailMessageStatus } from '../../store/model/detail_message';
import { createReviewError } from '../../review/messages';
import { Review } from '../../review/model';
import { InvoiceTransactionStatus } from './invoice';
import { Preference } from '../../preference/model';
import { DisputeProduct } from './dispute_product';

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
  RECEIVE_BY_BUYER: 6,
  PROCESS_OF_REFUND: 7,
  CLOSED: 8,
  REVIEWED: 9,
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize() {
    const dispute = {
      id: this.get('id_dispute'),
      user_id: this.get('id_users'),
      user: this.relations.user ? this.related('user').serialize({ account: true }) : undefined,
      store_id: this.get('id_toko'),
      store: this.relations.store ? this.related('store').serialize({ favorite: true }) : undefined,
      invoice_id: this.get('identifierinvoice_dispute'),
      invoice: this.relations.invoice ? this.related('invoice') : undefined,
      solution: parseNum(this.get('solusi_dispute')),
      problems: this.get('problem_dispute') ? this.getProblems() : null,
      note: this.get('alasan_dispute'),
      dispute_number: this.get('nopelaporan_dispute'),
      remarks: this.get('remarksresult_dispute'),
      airway_bill: this.get('noresi_dispute'),
      status: this.get('status_dispute'),
      response_status: parseNum(this.get('responadmin_dispute')),
      response_at: parseDate(this.get('tglresponadmin_dispute')),
      created_at: parseDate(this.get('createdate_dispute')),
    };
    if (this.relations.refund) {
      return {
        ...dispute,
        refund: this.related('refund').get('id_refund') ? this.related('refund') : null,
      };
    }
    return dispute;
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
    return this.morphMany('ImageGroup', 'group', ['group', 'parent_id'], 'dispute');
  }

  message() {
    return this.morphOne('Message', 'group', ['group_message', 'parent_id'], 1);
  }

  refund() {
    return this.hasOne('Refund', 'id_dispute');
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
    const { where, is_resolved: isResolved, page, pageSize, userId } = params;
    const relation = where.id_users ? 'store' : 'user';
    const disputes = await this.where(where)
      .query((qb) => {
        if (isResolved) qb.where('status_dispute', DisputeStatus.REVIEWED);
        else qb.whereNot('status_dispute', DisputeStatus.REVIEWED);
      })
      .fetchPage({
        page,
        pageSize,
        withRelated: [
          relation,
          'disputeProducts.product.images',
          'message.detailMessages',
        ],
      });

    return disputes.map(dispute => this.detailDispute(dispute, false, userId));
  }

  static async getDetail(where, userId) {
    const relation = where.id_users ? 'store' : 'user';
    const dispute = await this.where(where).fetch({
      withRelated: [
        'disputeProducts.product.images',
        'invoice.items.product',
        relation,
        'imageGroups',
        'message.store',
        'message.detailMessages.user',
        'refund',
      ],
    });

    if (!dispute) throw getDisputeError('dispute', 'not_found');

    const message = dispute.related('message');
    const discussions = message.related('detailMessages').map((msg) => {
      const msgObj = msg.serialize();
      const store = message.serialize().store;
      msgObj.store = (store.user_id === msgObj.user.id) ? store : null;
      if (!msgObj.status && userId !== msgObj.user.id) {
        msg.save({ status: DetailMessageStatus.READ }, { patch: true });
      }
      return msg;
    });

    let limitSend = null;
    if (dispute.get('status_dispute') === DisputeStatus.NEW) {
      limitSend = await Preference.get('send_product');
      limitSend = moment(dispute.get('createdate_dispute')).add(limitSend.value, 'd').unix();
    }

    const invoice = dispute.related('invoice');
    return {
      ...this.detailDispute(dispute),
      limit_send_product: limitSend,
      proofs: dispute.related('imageGroups'),
      products: invoice.related('items').map(item => item.related('product').serialize({ minimal: true })),
      discussions,
    };
  }

  static detailDispute(dispute, isDetail = true, userId = null) {
    let fine;
    let countUnread;

    if (isDetail) {
      fine = dispute.related('invoice').related('items').reduce((res, item) => {
        const found = _.find(dispute.related('disputeProducts').models, o => o.get('id_produk') === item.get('id_produk'));
        if (!found) res.push(item.related('product').serialize({ minimal: true }));
        return res;
      }, []);
    } else {
      const message = dispute.related('message');
      countUnread = message.related('detailMessages').reduce((res, msg) => {
        msg = msg.serialize();
        if (userId !== msg.user_id && !msg.status) res += 1;
        return res;
      }, 0);
    }

    const products = dispute.related('disputeProducts').map((val) => {
      const product = val.related('product');
      const image = product.related('images').models;
      return {
        ...product.serialize({ minimal: true }),
        image: image.length ? image[0].serialize().file : config.defaultImage.product,
      };
    });

    const disputeObj = dispute.serialize();
    if (isDetail && disputeObj.status === DisputeStatus.CLOSED && !fine.length) {
      disputeObj.status = DisputeStatus.REVIEWED;
      dispute.save({ status_dispute: DisputeStatus.REVIEWED }, { patch: true });
    }

    return {
      ...disputeObj,
      dispute_products: products,
      fine_products: fine,
      count_unread: countUnread,
    };
  }

  static async bulkReviewProducts(id, userId, reviews, marketplaceName) {
    const dispute = await this.where({ id_dispute: id, id_users: userId })
      .fetch({ withRelated: ['invoice.items.product', 'disputeProducts'] });

    if (!dispute) throw getDisputeError('dispute', 'not_found');

    const invoice = dispute.related('invoice');
    const disputeObj = dispute.serialize();
    let newReviews;

    if (
      disputeObj.solution === DisputeSolutionType.EXCHANGE
      && disputeObj.status === DisputeStatus.SEND_BY_SELLER
    ) {
      invoice.related('items').forEach((item) => {
        const found = _.find(reviews, o => o.product_id === item.get('id_produk'));
        if (!found) throw createReviewError('review', 'error');
      });

      newReviews = await Promise.all(invoice.related('items').map(async (item) => {
        const product = item.related('product').serialize();
        const val = _.find(reviews, o => o.product_id === product.id);
        return await Review.create(item, product, userId, val, marketplaceName);
      }));
    } else if (
      disputeObj.solution === DisputeSolutionType.REFUND
      && disputeObj.response_status !== DisputeResponseStatus.NO_RESPONSE_YET
      && disputeObj.status === DisputeStatus.CLOSED
    ) {
      const fine = dispute.related('invoice').related('items').reduce((res, item) => {
        const found = _.find(dispute.related('disputeProducts').models, o => o.get('id_produk') === item.get('id_produk'));
        if (!found) res.push(item.related('product').serialize({ minimal: true }));
        return res;
      }, []);

      fine.forEach((val) => {
        const found = _.find(reviews, o => o.product_id === val.id);
        if (!found) throw createReviewError('review', 'error');
      });

      newReviews = await Promise.all(fine.map(async (val) => {
        const item = _.find(invoice.related('items').models, o => o.get('id_produk') === val.id);
        const product = item.related('product').serialize();
        const body = _.find(reviews, o => o.product_id === product.id);
        return await Review.create(item, product, userId, body, marketplaceName);
      }));
    } else {
      throw createReviewError('review', 'disable');
    }

    await Promise.all([
      dispute.save({ status_dispute: DisputeStatus.REVIEWED }, { patch: true }),
      invoice.save({
        status_transaksi: InvoiceTransactionStatus.COMPLAINT_DONE,
        updated_at: moment().toDate(),
      }, { patch: true }),
    ]);

    return newReviews;
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
        flag_sender_at: moment().toDate(),
        flag_receiver_at: moment().toDate(),
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
      created_at: moment().toDate(),
    });
    const msg = await DetailMessage.create(detailMessageObj);
    return await msg.refresh({ withRelated: ['user'] });
  }

  static async updateAirwayBill(where, airwayBill) {
    const dispute = await this.where(where)
      .query(qb => qb.whereNotIn('status_dispute', [DisputeStatus.RECEIVE_BY_BUYER, DisputeStatus.CLOSED]))
      .fetch();
    if (!dispute) throw getDisputeError('dispute', 'not_found');
    return await dispute.save({
      noresi_dispute: airwayBill,
      status_dispute: DisputeStatus.SEND_BY_SELLER,
    }, { patch: true });
  }

  static async storeReceived(id, storeId) {
    const dispute = await this.where({
      id_toko: storeId,
      id_dispute: id,
      status_dispute: DisputeStatus.NEW,
    }).fetch({ withRelated: ['disputeProducts', 'invoice.items'] });
    if (!dispute) throw getDisputeError('dispute', 'not_found');
    return await dispute.save({ status_dispute: DisputeStatus.RECEIVE_BY_SELLER }, { patch: true });
  }

  static async refund(id, userId) {
    const dispute = await this.where({
      id_users: userId,
      id_dispute: id,
      status_dispute: DisputeStatus.SEND_BY_SELLER,
      solusi_dispute: DisputeSolutionType.EXCHANGE,
    }).fetch({ withRelated: ['disputeProducts'] });
    if (!dispute) throw getDisputeError('dispute', 'not_found');

    const disputeObj = dispute.serialize();
    const data = this.matchDBColumn({
      user_id: userId,
      store_id: disputeObj.store_id,
      invoice_id: disputeObj.invoice_id,
      invoice_type: 1, // default
      solution: DisputeSolutionType.REFUND,
      problems: dispute.get('problem_dispute'),
      note: disputeObj.note,
      dispute_number: disputeObj.dispute_number,
      status: DisputeStatus.NEW,
      response_status: DisputeResponseStatus.NO_RESPONSE_YET,
      response_at: moment().toDate(),
      created_at: moment().toDate(),
    });
    const cloneDispute = await this.create(data);
    await DisputeProduct.bulkClone(cloneDispute.serialize().id, dispute.related('disputeProducts'));
    await dispute.save({ status_dispute: DisputeStatus.CLOSED }, { patch: true });
    return cloneDispute;
  }

  static async getMessagesCount(where, userId) {
    const disputes = await this.where(where).fetchAll({ withRelated: ['message.detailMessages'] });
    return disputes.reduce((res, dispute) => {
      const detailMessages = dispute.related('message').related('detailMessages');
      const countDm = _.filter(detailMessages.models, dm => dm.get('id_users') !== userId
        && dm.get('status') === DetailMessageStatus.UNREAD);
      res += countDm.length;
      return res;
    }, 0);
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
      response_status: 'responadmin_dispute',
      response_at: 'tglresponadmin_dispute',
      created_at: 'createdate_dispute',
      path: 'pathpic_dispute',
      status: 'status_dispute',
    };
    return matchDB(data, column);
  }
}

export const Dispute = bookshelf.model('Dispute', DisputeModel);
