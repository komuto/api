import core from '../../core';

const bookshelf = core.postgres.db;

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
  static async addWishlist(id, userId) {
    const wishlist = await this.where({ id_produk: id, id_users: userId }).fetch();
    if (wishlist) {
      wishlist.destroy();
      return false;
    }
    const attach = {
      id_produk: id,
      id_users: userId,
      status_wishlist: 1,
      tglstatus_wishlist: new Date(),
    };
    new this().save(attach).catch(() => {});
    return true;
  }
}

export default bookshelf.model('Wishlist', WishlistModel);
