import ModelBase from 'bookshelf-modelbase';
import core from '../../core';
import { getItemError } from './../messages';
import config from './../../../../config';
import { Product } from '../../product/model/product';

const { parseNum } = core.utils;
const bookshelf = core.postgres.db;
bookshelf.plugin(ModelBase.pluggable);

class ItemModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'listbucket';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_listbucket';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false, note = false } = {}) {
    const item = {
      id: this.get('id_listbucket'),
      qty: this.get('qty_listbucket'),
      weight: this.get('beratproduk_listbucket'),
      additional_cost: parseNum(this.get('biayatambahan_listbucket')),
      total_price: parseNum(this.get('hargatotal_listbucket')),
    };
    if (note) item.note = this.get('keteranganopsi_listbucket');
    if (minimal) return item;
    return {
      ...item,
      bucket_id: this.get('id_bucket'),
      product_id: this.get('id_produk'),
      product: this.relations.product ? this.related('product').serialize() : undefined,
      invoice_id: this.get('id_invoice'),
      shipping_id: parseNum(this.get('id_pengiriman_produk')),
      shipping: this.relations.shipping ? this.related('shipping').serialize() : undefined,
      dropship: this.relations.dropship ? this.related('dropship').serialize() : undefined,
      dropshipper_id: parseNum(this.get('id_dropshipper'), null),
      review_id: parseNum(this.get('id_ulasanproduk'), null),
      store_id: parseNum(this.get('id_toko'), null),
      note: this.get('keteranganopsi_listbucket'),
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
   * Add relation to dropship
   */
  dropship() {
    return this.belongsTo('Dropship', 'id_dropshipper');
  }

  /**
   * Add relation to review
   */
  review() {
    return this.belongsTo('Review', 'id_ulasanproduk');
  }

  /**
   * Get item by bucket_id and product_id
   */
  static get(where, related) {
    return this.where(where).fetch({ withRelated: related });
  }

  static async loadDetailItem(item, domain) {
    let product = item.related('product');
    let shipping = item.related('shipping');
    let store = product.related('store');
    const image = product.related('image');
    const wholesale = product.related('wholesale').serialize();
    const expeditions = await Product.loadExpeditions(product, domain);
    const districtStore = store.related('user').related('addresses').models[0].related('district');

    if (item.get('id_dropshipper')) {
      await item.load('dropship.store');
      store = item.related('dropship').related('store');
    }

    product = product.serialize({ minimal: true, alterId: store.get('id_toko') });
    product.image = image ? image.serialize(domain).file : config.defaultImage.product;
    product.store = store.serialize({}, domain);
    product.location = { district: districtStore };
    product.expeditions = expeditions;
    product.wholesale = product.is_wholesaler ? wholesale : null;
    const address = shipping.related('address');

    const province = address.related('province');
    const district = address.related('district');
    const subDistrict = address.related('subDistrict');
    shipping = shipping.serialize({}, domain);
    shipping.address = {
      ...address.serialize(),
      province,
      district,
      subDistrict,
    };
    return {
      ...item.serialize(),
      product,
      shipping,
    };
  }

  /**
   * Get item by bucket_id and product_id
   */
  static async getDetail(where, domain) {
    const item = await this.where(where).fetch({
      withRelated: [
        { 'product.store.user.addresses': qb => (qb.where('alamat_originjual', 1)) },
        'product.store.user.addresses.district',
        'product.expeditionServices.expedition',
        'product.wholesale',
        'product.image',
        'shipping.address.province',
        'shipping.address.district',
        'shipping.address.subDistrict',
        'shipping.expeditionService.expedition',
      ],
    });
    if (!item) throw getItemError('item', 'not_found');
    return await this.loadDetailItem(item, domain);
  }

  /**
   * Update or insert item
   */
  static updateInsert(select, data) {
    return this.upsert(select, data);
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
      store_id: 'id_toko',
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
