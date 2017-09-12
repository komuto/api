import core from '../../core';
import { createDisputeError } from '../messages';

const { parseDate, matchDB } = core.utils;
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
      store_id: this.get('id_toko'),
      invoice_id: this.get('identifierinvoice_dispute'),
      invoice_type: this.get('tipeinvoice_dispute'),
      solution: this.get('solusi_dispute'),
      problems: this.get('problem_dispute'),
      note: this.get('alasan_dispute'),
      dispute_number: this.get('nopelaporan_dispute'),
      remarks: this.get('remarksresult_dispute'),
      status: this.get('status_dispute'),
      response_status: this.get('responadmin_dispute'),
      response_at: parseDate(this.get('tglresponadmin_dispute')),
      created_at: parseDate(this.get('createdate_dispute')),
    };
  }

  disputeProducts() {
    return this.hasMany('DisputeProduct', 'id_dispute');
  }

  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createDisputeError('dispute', 'error');
    });
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
