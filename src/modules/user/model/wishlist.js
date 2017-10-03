import core from '../../core';

const bookshelf = core.postgres.db;

export const WishlistStatus = {
  ACTIVE: 1,
};

class WishlistModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'wishlist';
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
      tglstatus_wishlist: new Date(),
    };
    await new this().save(attach).catch(() => {});
    return true;
  }

  static async get(userId, params, page, pageSize) {
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
        if (sort) {
          qb.join('produk as p', 'p.id_produk', 'wishlist.id_produk').orderBy(sort.column, sort.by);
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
          'product.likes',
          'dropship.store',
        ],
      });

    return wishlists.map((wishlist) => {
      let product = wishlist.related('product');
      let store = product.related('store');
      if (wishlist.get('id_dropshipper')) {
        store = wishlist.related('dropship').related('store');
      }
      const images = product.related('images');
      const countLike = product.related('likes').length;
      product = { ...product.serialize({ minimal: true, wishlist: true }), count_like: countLike };
      return { product, store, images };
    });
  }
}

export const Wishlist = bookshelf.model('Wishlist', WishlistModel);
export default { Wishlist, WishlistStatus };
