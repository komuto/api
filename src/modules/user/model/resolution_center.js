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

export const ResolutionTopic = {
  GENERAL: 0,
  INFO: 1,
  TRANSACTION: 2,
  ETC: 3,
};

export const ResolutionPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}, name, domain) {
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

    resolution.discussions = JSON.parse(this.get('isipesan_rescenter')).map(msg => ({
      name: msg.user !== 'Admin' ? name : 'admin',
      message: msg.pesan,
      created_at: parseDate(msg.create_at),
    }));

    if (this.relations.imageGroups) resolution.images = this.related('imageGroups').serialize(domain);
    return resolution;
  }

  imageGroups() {
    return this.morphMany('ImageGroup', 'group', ['group', 'parent_id'], 'resolusi');
  }

  static get(id, isClosed, page, pageSize) {
    return this.where({ id_users: id })
      .query((qb) => {
        if (isClosed) qb.where('status_ticket_rescenter', 0);
        else qb.whereNot('status_ticket_rescenter', 0);
      })
      .orderBy('tglstatus_ticket_rescenter', 'desc')
      .fetchPage({ page, pageSize });
  }

  static getDetail(id, resolutionId) {
    return this.where({
      id_users: id,
      id_rescenter: resolutionId,
    }).fetch({ withRelated: ['imageGroups'] });
  }

  static create(data) {
    return new this(data).save().catch(() => {
      throw createResolutionError('resolution_center', 'error');
    });
  }

  static createDiscussion(name, message) {
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

  pushMessage(name, msg) {
    const discussions = JSON.parse(this.get('isipesan_rescenter'));
    discussions.push({
      user: name,
      pesan: msg,
      create_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    });
    return JSON.stringify(discussions);
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
      discussions: 'isipesan_rescenter',
      status: 'status_ticket_rescenter',
      status_at: 'tglstatus_ticket_rescenter',
      ends_at: 'enddate_rescenter',
      created_at: 'datecreated_rescenter',
      is_read: 'is_read',
    };
    return matchDB(data, column);
  }
}

export const ResolutionCenter = bookshelf.model('ResolutionCenter', ResolutionCenterModel);
export default { ResolutionCenter, ResolutionCenterStatus, ResolutionTopic, ResolutionPriority };
