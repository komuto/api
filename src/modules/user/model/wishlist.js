import moment from 'moment';
import core from '../../core';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;

export const WishlistStatus = {
  ACTIVE: 1,
};

class WishlistModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'wishlist';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  dropship() {
    return this.belongsTo('Dropship', 'id_dropshipper');
  }

  /**
   * Add to wishlist
   */
  static async addWishlist(id, userId, dropshipperId) {
    const wishlist = await this.where({
      id_produk: id,
      id_users: userId,
      id_dropshipper: dropshipperId,
    }).fetch();

    if (wishlist) {
      await this.where({
        id_produk: id,
        id_users: userId,
        id_dropshipper: dropshipperId,
      }).destroy();
      return false;
    }

    const attach = {
      id_produk: id,
      id_users: userId,
      id_dropshipper: dropshipperId,
      status_wishlist: WishlistStatus.ACTIVE,
      tglstatus_wishlist: moment().toDate(),
    };
    await new this().save(attach).catch(() => {});
    return true;
  }

  static async get(userId, params, page, pageSize) {
    const { query } = params;
    let { sort } = params;

    switch (sort) {
      case 'cheapest':
        sort = { column: 'harga_produk', by: 'asc' };
        break;
      case 'expensive':
        sort = { column: 'harga_produk', by: 'desc' };
        break;
      case 'selling':
        sort = { column: 'count_sold', by: 'desc' };
        break;
      case 'newest':
        sort = { column: 'date_created_produk', by: 'desc' };
        break;
      default:
        sort = null;
        break;
    }

    const wishlists = await this.where('id_users', userId)
      .query((qb) => {
        if (query || sort) {
          qb.join('produk as p', 'p.id_produk', 'wishlist.id_produk');
          if (sort) qb.orderBy(sort.column, sort.by);
          if (query) qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        } else {
          qb.orderBy('tglstatus_wishlist', 'desc');
        }
      })
      .fetchPage({
        page,
        pageSize,
        withRelated: [
          'product',
          'product.store',
          'product.images',
          'dropship.store',
        ],
      });

    return await Promise.all(wishlists.map(async (wishlist) => {
      let product = wishlist.related('product');
      let store = product.related('store');
      if (wishlist.get('id_dropshipper')) {
        store = wishlist.related('dropship').related('store');
      }
      const images = product.related('images');
      const countLike = await this.getCountLike(product.id, wishlist.get('id_dropshipper'));
      product = product.serialize({ minimal: true, wishlist: true });
      product.id = `${product.id}.${store.id}`;
      product = { ...product, count_like: parseNum(countLike) };
      return { product, store, images };
    }));
  }

  static getCountLike(productId, dropshipperId) {
    return this.where({
      id_produk: productId,
      id_dropshipper: dropshipperId,
    }).count();
  }
}

export const Wishlist = bookshelf.model('Wishlist', WishlistModel);
export default { Wishlist, WishlistStatus };
