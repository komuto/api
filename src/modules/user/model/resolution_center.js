import core from '../../core';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;

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
      status_at: parseDate(this.get('enddate_rescenter')),
      ends_at: parseDate(this.get('enddate_rescenter')),
      created_at: parseDate(this.get('datecreated_rescenter')),
      updated_at: parseDate(this.get('update_at'), null),
    };
    if (minimal) return resolution;
    const content = JSON.parse(this.get('isipesan_rescenter')).map(msg => ({
      ...msg,
      user: msg.user !== 'Admin' ? name : 'admin',
      create_at: parseDate(msg.create_at),
    }));
    return { ...resolution, content };
  }
}

export const ResolutionCenter = bookshelf.model('ResolutionCenter', ResolutionCenterModel);
export default { ResolutionCenter };
