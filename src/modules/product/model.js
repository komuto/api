import _ from 'lodash';
import moment from 'moment';
import core from '../core';

const bookshelf = core.postgres.db;

bookshelf.plugin('pagination');

class ProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_produk';
  }

  /**
   * Add relation to Store
   */
  store() {
    return this.belongsTo('Store', 'id_toko', 'id_toko');
  }

  /**
   * Add relation to ImageProduct
   */
  imageProducts() {
    return this.hasMany('ImageProduct', 'id_produk', 'id_produk');
  }

  /**
   * Get products by condition
   */
  static async get(page, limit, condition = null, query = null, sort = null) {
    switch (sort) {
      case 'newest':
        sort = 'date_created_produk';
        break;
      case 'cheapest':
        sort = 'harga_produk';
        break;
      case 'expensive':
        sort = '-harga_produk';
        break;
      case 'best-selling':
        sort = '-count_sold';
        break;
      default:
        sort = 'date_created_produk';
        break;
    }

    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition)
      .query((qb) => {
        if (query) {
          qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        }
      })
      .orderBy(sort)
      .fetchPage({ page, limit, withRelated: ['store', 'imageProducts'] });
  }

  /**
   * Get search result
   */
  static async search(query = null) {
    return await this.query((qb) => {
      qb.select('nama_produk');
      qb.groupBy('nama_produk');
      qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
    }).fetchAll();
  }
}

ProductModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_produk,
    category_id: this.attributes.id_kategoriproduk,
    store_id: this.attributes.id_toko,
    name: this.attributes.nama_produk,
    stock: this.attributes.stock_produk,
    weight: this.attributes.berat_produk,
    type: this.attributes.jenis_produk,
    description: this.attributes.deskripsi_produk,
    price: this.attributes.harga_produk ? parseFloat(this.attributes.harga_produk) : undefined,
    attrval: this.attributes.attrval_produk,
    status: this.attributes.status_produk ? parseInt(this.attributes.status_produk, 10) : undefined,
    // eslint-disable-next-line max-len
    insurance: this.attributes.asuransi_produk ? parseInt(this.attributes.asuransi_produk, 10) : undefined,
    discount: this.attributes.disc_produk,
    margin_dropshipper: this.attributes.margin_dropshiper,
    is_dropshipper: this.attributes.is_dropshiper,
    is_wholesaler: this.attributes.is_grosir,
    count_sold: this.attributes.count_sold,
    count_popular: this.attributes.count_populer,
    identifier_brand: this.attributes.identifier_brand,
    identifier_catalog: this.attributes.identifier_katalog,
    // eslint-disable-next-line max-len
    status_at: this.attributes.tglstatus_produk ? moment(this.attributes.tglstatus_produk).unix() : undefined,
    // eslint-disable-next-line max-len
    created_at: this.attributes.date_created_produk ? moment(this.attributes.date_created_produk).unix() : undefined,
  };
};

export const Product = ProductModel;
export default bookshelf.model('Product', ProductModel);
