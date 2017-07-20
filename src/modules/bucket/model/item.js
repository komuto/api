import core from '../../core';
import { createItemError } from './../messages';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;

class ItemModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'listbucket';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_listbucket';
  }

  serialize() {
    return {
      id: this.get('id_ulasanproduk'),
      bucket_id: this.get('id_bucket'),
      product_id: this.get('id_produk'),
      invoice_id: this.get('id_invoice'),
      shipping_id: parseNum(this.get('id_pengiriman_produk')),
      dropshipper_id: parseNum(this.get('id_dropshipper')),
      qty: this.get('qty_listbucket'),
      weight: this.get('beratproduk_listbucket'),
      note: this.get('keteranganopsi_listbucket'),
      additional_cost: parseNum(this.get('biayatambahan_listbucket')),
      total_price: parseNum(this.get('hargatotal_listbucket')),
    };
  }

  /**
   * Add relation to product
   */
  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  /**
   * Add relation to shipping
   */
  shipping() {
    return this.belongsTo('Shipping', 'id_pengiriman_produk');
  }

  /**
   * Create item
   */
  static async create(data) {
    return await new this(data).save().catch(() => {
      throw createItemError('item', 'error');
    });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      bucket_id: 'id_bucket',
      product_id: 'id_produk',
      invoice_id: 'id_invoice',
      shipping_id: 'id_pengiriman_produk',
      dropshipper_id: 'id_dropshipper',
      qty: 'qty_listbucket',
      weight: 'beratproduk_listbucket',
      note: 'keteranganopsi_listbucket',
      additional_cost: 'biayatambahan_listbucket',
      total_price: 'hargatotal_listbucket',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Item = bookshelf.model('Item', ItemModel);
export default { Item };
