import core from '../../core';
import { createCatalogError, getCatalogError, updateCatalogError } from './../messages';

const bookshelf = core.postgres.db;
const { parseDate, defaultNull } = core.utils;

class CatalogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'katalog';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_katalog';
  }

  serialize() {
    return {
      id: this.get('id_katalog'),
      store_id: this.get('id_toko'),
      name: this.get('nama_katalog'),
      count_product: defaultNull(this.get('count_product')),
      created_at: parseDate(this.get('datecreate_katalog')),
    };
  }

  products() {
    return this.hasMany('Product', 'identifier_katalog');
  }

  static async getUserCatalog(id) {
    return await this.query((qb) => {
      qb.select('id_katalog', 'nama_katalog');
      qb.count('produk.* as count_product');
      qb.innerJoin('produk', 'katalog.id_katalog', 'produk.identifier_katalog');
      qb.innerJoin('toko', 'produk.id_toko', 'toko.id_toko');
      qb.where('id_users', id);
      qb.groupBy('id_katalog');
      qb.orderBy('id_katalog');
    }).fetchAll();
  }

  static async create(data) {
    const catalog = await this.where({ id_toko: data.store_id })
      .query((qb) => {
        qb.whereRaw('LOWER(nama_katalog) LIKE ?', `%${data.name.toLowerCase()}%`);
      }).fetch().catch(() => {
        throw createCatalogError('catalog', 'error');
      });
    if (catalog) throw createCatalogError('catalog', 'duplicate');

    return await new this(this.matchDBColumn(data)).save().catch(() => {
      throw createCatalogError('catalog', 'error');
    });
  }

  /**
   * Find by catalog id and store id
   */
  static async findByIdAndStoreId(id, storeId) {
    const catalog = await this.where({ id_katalog: id, id_toko: storeId }).fetch()
      .catch(() => {
        throw getCatalogError('catalog', 'error');
      });
    if (!catalog) throw getCatalogError('catalog', 'not_found');
    return catalog.serialize();
  }

  /**
   * Update catalog
   */
  static async update(id, storeId, data) {
    let catalog = await this.where({ id_toko: storeId })
      .query((qb) => {
        qb.whereNotIn('id_katalog', [id]);
        qb.whereRaw('LOWER(nama_katalog) LIKE ?', `%${data.nama_katalog.toLowerCase()}%`);
      }).fetch().catch(() => {
        throw updateCatalogError('catalog', 'error');
      });
    if (catalog) throw updateCatalogError('catalog', 'duplicate');

    catalog = await this.where({ id_katalog: id, id_toko: storeId })
      .save(data, { method: 'update' })
      .catch(() => {
        throw updateCatalogError('catalog', 'error');
      });
    return await catalog.fetch();
  }

  static matchDBColumn(data) {
    const column = {
      catalog_id: 'id_katalog',
      store_id: 'id_toko',
      name: 'nama_katalog',
      created_at: 'datecreate_katalog',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }

  /**
   * Check whether the catalog has products or not
   * @param id {integer} catalog id
   * @return boolean
   */
  static async checkProduct(id) {
    const catalog = await this.where({ id_katalog: id }).fetch({ withRelated: {
      products: qb => qb.column('identifier_katalog') } });
    return !!catalog.related('products').length;
  }

  /**
   * Check whether store has the catalog or not
   * @param storeId {integer}
   * @param catalogId {integer}
   */
  static async checkCatalog(storeId, catalogId) {
    const catalog = await this.where({ id_toko: storeId, id_katalog: catalogId }).fetch();
    return !!catalog;
  }
}

export const Catalog = bookshelf.model('Catalog', CatalogModel);
export default { Catalog };
