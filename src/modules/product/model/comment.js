import core from '../../core';

const bookshelf = core.postgres.db;
const { parseDate, parseNum } = core.utils;

class CommentModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'sub_diskusi';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_subdiskusi';
  }

  serialize(minimal = false) {
    if (minimal) {
      return {
        id: this.get('id_subdiskusi'),
        user_id: this.get('id_subdiskusi'),
        discussion_id: this.get('id_diskusi'),
        content: this.get('reply_subdiskusi'),
        created_at: parseDate(this.get('tgl_subdiskusi')),
      };
    }
    return {
      id: this.get('id_subdiskusi'),
      user_id: this.get('id_subdiskusi'),
      discussion_id: this.get('id_diskusi'),
      content: this.get('reply_subdiskusi'),
      created_at: this.get('tgl_subdiskusi'),
      is_deleted: !!parseNum(this.get('hapus_subdiskusi')),
      deleted_at: parseDate(this.get('tglhapus_subdiskusi')),
    };
  }
}

export const Comment = bookshelf.model('Comment', CommentModel);
export default { Comment };
