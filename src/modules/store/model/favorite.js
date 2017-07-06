import moment from 'moment';
import core from '../../core';
import '../../user/model/user';

const bookshelf = core.postgres.db;

class FavoriteStoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko_favorit';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_tokofavorit';
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  static async create(data) {
    data.status_tokofavorit = '1';
    data.tglstatus_tokofavorit = moment();
    return await new this(data).save();
  }
}

export const FavoriteStore = bookshelf.model('FavoriteStore', FavoriteStoreModel);
export default { FavoriteStore };
