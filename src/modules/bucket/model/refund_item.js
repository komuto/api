import _ from 'lodash';
import core from '../../core';
import config from './../../../../config';

const { matchDB, getProductAndStore } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.product;

class RefundItemModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'bucket_refund_item';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_refund_item';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false } = {}, domain) {
    const item = {
      id: this.get('id_refund_item'),
      product_id: this.get('id_produk'),
      product_name: this.get('nama_produk'),
      product_image: !this.relations.image ? undefined
        : core.imagePath(domain, IMAGE_PATH, this.related('image').get('file_gambarproduk')),
    };
    if (minimal) return item;
    return {
      ...item,
      refund_id: this.get('id_refund'),
      item_id: this.get('id_bucket_list'),
      product_price: this.get('harga_produk'),
      qty: this.get('qty'),
      total: this.get('total_harga'),
    };
  }

  image() {
    return this.hasOne('ImageProduct', 'id_produk', 'id_produk');
  }

  static async bulkCreate(refundId, products, items) {
    return await Promise.all(products.map(async (val) => {
      const { productId } = getProductAndStore(val);
      const item = _.find(items, o => o.product.id === productId);
      if (!item) return null;
      const data = this.matchDBColumn({
        refund_id: refundId,
        item_id: item.id,
        product_id: productId,
        product_name: item.product.name,
        product_price: item.product.price,
        qty: item.qty,
        total: item.qty * item.product.price,
      });
      return await new this().save(data);
    }));
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      refund_id: 'id_refund',
      item_id: 'id_bucket_list',
      product_id: 'id_produk',
      product_name: 'nama_produk',
      product_price: 'harga_produk',
      qty: 'qty',
      total: 'total_harga',
    };
    return matchDB(data, column);
  }
}

export const RefundItem = bookshelf.model('RefundItem', RefundItemModel);
export default { RefundItem };
