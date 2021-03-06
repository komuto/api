import moment from 'moment';
import core from '../../core';
import { Address } from '../../address/model';
import { Product } from '../../product/model/product';

const { parseNum } = core.utils;
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  store() {
    return this.belongsTo('Store', 'referred_toko');
  }

  static create(data) {
    return new this({
      ...data,
      status_tokofavorit: FavoriteStoreStatus.ON,
      tglstatus_tokofavorit: moment().toDate(),
    }).save();
  }

  /**
   * Get list of favorite store with its products
   * @param id {integer} user id
   * @param marketplace {object}
   * @param query {string}
   * @param pageSize {integer} limit
   * @param page {integer}
   */
  static async getListFavoriteStore(id, marketplace, query, pageSize, page) {
    const { id: marketplaceId, mobile_domain: domain } = marketplace;
    const favorites = await this.query((qb) => {
      qb.where('toko_favorit.id_users', id);
      qb.where('toko_favorit.referred_marketplace', marketplaceId);
      if (query) {
        qb.join('toko as t', 't.id_toko', 'toko_favorit.referred_toko');
        qb.whereRaw('LOWER(nama_toko) LIKE ?', `%${query.toLowerCase()}%`);
      }
    }).fetchPage({ pageSize, page, withRelated: ['store.user'] });

    const getProducts = favorites.models.map((favorite) => {
      const store = favorite.related('store');
      const storeId = store.get('id_toko');
      return Product.getStoreProducts(storeId, 3, true);
    });

    const addresses = [];
    const stores = await Promise.all(favorites.models.map(async (favorite, idx) => {
      const store = favorite.related('store');
      const products = await getProducts[idx];
      const userId = store.related('user').get('id_users');
      // Get province
      addresses.push(Address.getStoreAddress(userId));
      return {
        store: store.serialize({ favorite: true }, domain),
        products,
      };
    }));

    return Promise.all(stores.map(async (store, idx) => {
      store.products = await Promise.all(store.products.map(async (product) => {
        const [countLike, isLiked] = await Promise.all(Product.getLike(product, id));
        return {
          ...product.serialize({ minimal: true, alterId: true }, domain),
          count_like: parseNum(countLike),
          is_liked: !!isLiked,
        };
      }));
      const address = await addresses[idx];
      store.store.province = address.related('province').serialize();
      return store;
    }));
  }

  static getFavorite(storeId, userId) {
    return this.where({ referred_toko: storeId, id_users: userId }).fetch();
  }
}

export const FavoriteStore = bookshelf.model('FavoriteStore', FavoriteStoreModel);
export default { FavoriteStore, FavoriteStoreStatus };
