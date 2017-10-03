import moment from 'moment';
import core from '../../core';
import { Wishlist } from '../../user/model/wishlist';
import { Address } from '../../address/model';
import { Product, ProductStatus } from '../../product/model';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;
const knex = bookshelf.knex;

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
    data.status_tokofavorit = FavoriteStoreStatus.ON;
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
      .fetchPage({ pageSize, page, withRelated: ['store.user'] });
    const getProducts = favorites.models.map((favorite) => {
      const store = favorite.related('store');
      const storeId = store.get('id_toko');
      return Product.getStoreProducts(storeId, 3);
    });

    const addresses = [];
    const getLikes = [];
    const stores = await Promise.all(favorites.models.map(async (favorite, idx) => {
      const store = favorite.related('store');
      const products = await getProducts[idx];
      const like = products.map(product => Wishlist.where({
        id_produk: product.get('id_produk'),
        id_dropshipper: parseNum(product.get('id_dropshipper')) || null,
      }).fetchAll());
      getLikes[idx] = like;
      const userId = store.related('user').get('id_users');
      // Get province
      addresses.push(Address.getStoreAddress(userId));
      return {
        store: store.serialize({ favorite: true }),
        products,
      };
    }));

    return Promise.all(stores.map(async (store, idx) => {
      store.products = await Promise.all(store.products.map(async (product, key) => {
        const likes = await getLikes[idx][key];
        const { is_liked, count_like } = Product.loadLikesDropship(id, likes, product);
        return { ...product.serialize({ minimal: true, alterId: true }), is_liked, count_like };
      }));
      const address = await addresses[idx];
      store.store.province = address.related('province').serialize();
      return store;
    }));
  }
}

export const FavoriteStore = bookshelf.model('FavoriteStore', FavoriteStoreModel);
export default { FavoriteStore, FavoriteStoreStatus };
