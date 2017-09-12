import _ from 'lodash';
import core from '../../core';

const { matchDB, getProductAndStore } = core.utils;
const bookshelf = core.postgres.db;

class DisputeProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'dispute_product';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_dispute_product';
  }

  serialize() {
    return {
      id: this.get('id_dispute_product'),
      dispute_id: this.get('id_dispute'),
      product_id: this.get('id_produk'),
      name: this.get('nama_produk'),
      price: this.get('harga_produk'),
      qty: this.get('qty'),
    };
  }

  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  static async bulkCreate(disputeId, products, items) {
    return await Promise.all(products.map(async (val) => {
      const { productId } = getProductAndStore(val);
      const item = _.find(items, o => o.product.id === productId);
      if (!item) return null;
      const data = this.matchDBColumn({
        dispute_id: disputeId,
        product_id: productId,
        name: item.product.name,
        price: item.product.price,
        qty: item.qty,
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
      dispute_id: 'id_dispute',
      product_id: 'id_produk',
      name: 'nama_produk',
      price: 'harga_produk',
    };
    return matchDB(data, column);
  }
}

export const DisputeProduct = bookshelf.model('DisputeProduct', DisputeProductModel);
export default { DisputeProduct };
