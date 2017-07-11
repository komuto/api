import core from '../../core';

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
      option_information: 'keteranganopsi_listbucket',
      delivery_cost: 'ongkir_listbucket',
      additional_cost: 'biayatambahan_listbucket',
      total_price: 'hargatotal_listbucket',
      final_price: 'hargafinal_listbucket',
      status: 'status_listbucket',
      status_at: 'tglstatus_listbucket',
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
    shipping_id: this.attributes.id_pengiriman_produk,
    dropshipper_id: this.attributes.id_dropshipper,
    qty: this.attributes.qty_listbucket,
    weight: this.attributes.beratproduk_listbucket,
    option_information: this.attributes.keteranganopsi_listbucket,
    delivery_cost: this.attributes.ongkir_listbucket,
    additional_cost: this.attributes.biayatambahan_listbucket,
    total_price: this.attributes.hargatotal_listbucket,
    final_price: this.attributes.hargafinal_listbucket,
    status: this.attributes.status_listbucket,
    status_at: this.attributes.tglstatus_listbucket,
  };
};

export const Item = bookshelf.model('Item', ItemModel);
export default { Item };