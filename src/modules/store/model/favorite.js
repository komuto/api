import moment from 'moment';
import core from '../../core';
import { model } from '../../address';

const { Address } = model;
const bookshelf = core.postgres.db;

export const FavoriteStoreStatus = {
  OFF: 0,
  ON: 1,
};

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

  store() {
    return this.belongsTo('Store', 'referred_toko');
  }

  static async create(data) {
    data.status_tokofavorit = '1';
    data.tglstatus_tokofavorit = moment();
    return await new this(data).save();
  }

  /**
   * Get list of favorite store with its products
   * @param id {integer} user id
   * @param pageSize {integer} limit
   * @param page {integer}
   */
  static async getListFavoriteStore(id, pageSize, page) {
    const favorites = await this.where('id_users', id)
      .fetchPage({ pageSize, page, withRelated: ['store.products.images', 'store.user'] });

    let addresses = [];
    const stores = favorites.models.map((favorite) => {
      const store = favorite.related('store');
      const products = store.related('products').map((product) => {
        const image = product.related('images').models[0].serialize().file;
        return { ...product.serialize({ minimal: true }), image };
      });
      const userId = store.related('user').get('id_users');
      addresses.push(Address.getStoreAddress(userId));
      return {
        store: store.serialize({ favorite: true }),
        products,
      };
    });
    // Get province name
    addresses = await Promise.all(addresses);
    return Object.keys(addresses).map((key) => {
      stores[key].store.province = addresses[key].related('province').serialize();
      return stores[key];
    });
  }
}

export const FavoriteStore = bookshelf.model('FavoriteStore', FavoriteStoreModel);
export default { FavoriteStore, FavoriteStoreStatus };
