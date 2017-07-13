import core from '../../core';
import { BadRequestError } from '../../../../common/errors';

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
      throw new BadRequestError('Error save item');
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

ItemModel.prototype.serialize = function () {
  return {
    id: this.attributes.id_ulasanproduk,
    bucket_id: this.attributes.id_bucket,
    product_id: this.attributes.id_produk,
    invoice_id: this.attributes.id_invoice,
    shipping_id: parseNum(this.attributes.id_pengiriman_produk),
    dropshipper_id: parseNum(this.attributes.id_dropshipper),
    qty: this.attributes.qty_listbucket,
    weight: this.attributes.beratproduk_listbucket,
    note: this.attributes.keteranganopsi_listbucket,
    additional_cost: parseNum(this.attributes.biayatambahan_listbucket),
    total_price: parseNum(this.attributes.hargatotal_listbucket),
  };
};

export const Item = bookshelf.model('Item', ItemModel);
export default { Item };
