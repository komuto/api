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
  static async get(page, pageSize, condition = null) {
    condition = _.omitBy(condition, _.isNil);
    return await this.where(condition).fetchPage({ page, pageSize, withRelated: ['store', 'imageProducts'] });
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
    price: parseFloat(this.attributes.harga_produk),
    attrval: this.attributes.attrval_produk,
    status: parseInt(this.attributes.status_produk, 10),
    insurance: parseInt(this.attributes.asuransi_produk, 10),
    discount: this.attributes.disc_produk,
    margin_dropshipper: this.attributes.margin_dropshiper,
    is_dropshipper: this.attributes.is_dropshiper,
    is_wholesaler: this.attributes.is_grosir,
    count_sold: this.attributes.count_sold,
    count_popular: this.attributes.count_populer,
    identifier_brand: this.attributes.identifier_brand,
    identifier_catalog: this.attributes.identifier_katalog,
    status_at: moment(this.attributes.tglstatus_produk).unix(),
    created_at: moment(this.attributes.date_created_produk).unix(),
  };
};

export const Product = ProductModel;
export default bookshelf.model('Product', ProductModel);
