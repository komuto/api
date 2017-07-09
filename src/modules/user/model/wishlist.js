import core from '../../core';

const bookshelf = core.postgres.db;

class WishlistModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'wishlist';
  }

  products() {
    return this.hasMany('Product', 'id_produk');
  }
}

export default bookshelf.model('Wishlist', WishlistModel);
