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

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_produk';
  }

  products() {
    return this.hasMany('Product', 'id_produk');
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
      wishlist.destroy();
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
}

export const Wishlist = bookshelf.model('Wishlist', WishlistModel);
export default { Wishlist, WishlistStatus };
