import moment from 'moment';
import core from '../../core';
import { createResolutionError } from '../messages';

const { parseDate, parseNum, matchDB } = core.utils;
const bookshelf = core.postgres.db;

export const ResolutionCenterStatus = {
  CLOSE: 0,
  OPEN: 1,
  WAIT_TO_REPLY: 2,
};

class ResolutionCenterModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'resolusi_center';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_rescenter';
  }

  serialize({ minimal = false } = {}, name) {
    const resolution = {
      id: this.get('id_rescenter'),
      user_id: this.get('id_users'),
      ticket_number: this.get('no_ticket_rescenter'),
      priority: parseNum(this.get('prioritas_rescenter')),
      topic: parseNum(this.get('topik_rescenter')),
      title: this.get('title_rescenter'),
      status: parseNum(this.get('status_ticket_rescenter')),
      status_at: parseDate(this.get('tglstatus_ticket_rescenter')),
      ends_at: parseDate(this.get('enddate_rescenter')),
      created_at: parseDate(this.get('datecreated_rescenter')),
      updated_at: parseDate(this.get('update_at'), null),
    };
    if (minimal) return resolution;
    // TODO: Serialize content key
    const content = JSON.parse(this.get('isipesan_rescenter')).map(msg => ({
      ...msg,
      user: msg.user !== 'Admin' ? name : 'admin',
      create_at: parseDate(msg.create_at),
    }));
    return { ...resolution, content };
  }

  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createResolutionError('resolution_center', 'error');
    });
  }

  static createContent(name, message) {
    const content = [
      {
        user: name,
        pesan: message,
        create_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      },
    ];
    return JSON.stringify(content);
  }

  static async getTicketNumber() {
    const resolution = await this.query((qb) => {
      qb.orderBy('id_rescenter', 'desc');
    }).fetch();

    return `RS-00${(resolution.get('id_rescenter') + 1)}`;
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      ticket_number: 'no_ticket_rescenter',
      priority: 'prioritas_rescenter',
      topic: 'topik_rescenter',
      title: 'title_rescenter',
      content: 'isipesan_rescenter',
      status: 'status_ticket_rescenter',
      status_at: 'tglstatus_ticket_rescenter',
      ends_at: 'enddate_rescenter',
      created_at: 'datecreated_rescenter',
    };
    return matchDB(data, column);
  }
}

export const ResolutionCenter = bookshelf.model('ResolutionCenter', ResolutionCenterModel);
export default { ResolutionCenter, ResolutionCenterStatus };
