import core from '../../core';
import { createDropshipError } from './../messages';

const bookshelf = core.postgres.db;
const { parseDate, parseNum } = core.utils;

export const DropshipStatus = {
  HIDE: 0,
  SHOW: 1,
};

class DropshipModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'dropshipper';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_dropshipper';
  }

  serialize() {
    return {
      id: parseNum(this.get('id_dropshipper')),
      product_id: parseNum(this.get('id_produk')),
      catalog_id: this.get('id_katalog'),
      store_id: this.get('id_toko'),
      status: parseNum(this.get('status_dropshipper')),
      status_at: parseDate(this.get('tglstatus_dropshipper')),
      created_at: parseDate(this.get('createdate_dropshipper')),
    };
  }

  /**
   * Add relation to Product
   */
  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  /**
   * Add relation to Catalog
   */
  catalog() {
    return this.belongsTo('Catalog', 'id_katalog');
  }

  /**
   * Create dropship
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createDropshipError('dropship', 'error');
    });
  }

  static async findDuplicate(productId, storeId) {
    return await new this({ id_produk: productId, id_toko: storeId }).fetch();
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      product_id: 'id_produk',
      catalog_id: 'id_katalog',
      store_id: 'id_toko',
      status: 'status_dropshipper',
      status_at: 'tglstatus_dropshipper',
      created_at: 'createdate_dropshipper',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Dropship = bookshelf.model('Dropship', DropshipModel);
export default { Dropship, DropshipStatus };
