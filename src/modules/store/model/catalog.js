import Promise from 'bluebird';
import core from '../../core';
import { createCatalogError, getCatalogError, updateCatalogError } from './../messages';
import config from './../../../../config';
import { ProductStatus, DropshipStatus, Product } from './../../product/model';

const bookshelf = core.postgres.db;
const knex = core.postgres.knex;
const { parseDate, defaultNull, parseNum } = core.utils;

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

  static async getStoreCatalog(storeId) {
    const catalogs = await this.where({ id_toko: storeId }).fetchAll({ withRelated: 'products' });
    return catalogs.map((catalog) => {
      const count = catalog.related('products');
      return {
        ...catalog.serialize(),
        count_product: count.length,
      };
    });
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

  static async loadProducts(catalogIds, storeId, limit, status, page, pageSize) {
    const dropshipStatus = DropshipStatus.SHOW;
    const productStatus = status;
    const pagination = page && pageSize ? { page, pageSize } : {};
    return await Promise.all(catalogIds.map(id => Product.query((qb) => {
      qb.select(knex.raw('*, null as id_dropshipper, null as nama_toko'));
      qb.where('id_toko', storeId);
      if (id !== 0) qb.where('identifier_katalog', id);
      else qb.whereNull('identifier_katalog');
      // qb.whereRaw('status_produk = ? union select *, null as id_dropshipper, null as nama_toko' +
      //   ' from produk where id_toko = ?', [productStatus, 41]);
      qb.union(function () {
        this.select(['p.*', 'd.id_dropshipper', 'nama_toko']);
        // this.from('dropshipper as d');
        this.join('produk as p', 'p.id_produk', 'd.id_produk');
        this.join('toko as t', 'p.id_toko', 't.id_toko');
        this.where('d.id_toko', storeId).andWhere('status_dropshipper', dropshipStatus);
        if (id !== 0) this.where('d.id_katalog', id);
        else this.whereNull('d.id_katalog');
      });
      qb.orderBy('id_produk', 'DESC');
      if (limit) qb.limit(3);
    }).fetchPage({ ...pagination, debug: true })));
  }

  static async loadCatalog(storeId, catalogId) {
    const query = { id_toko: storeId };
    if (catalogId) query.id_katalog = catalogId;
    return await this.where(query).fetchAll();
  }

  /**
   * Get catalog with products
   */
  static async getCatalogWithProducts(params) {
    const { storeId, hidden, catalogId, page = null, pageSize = null } = params;
    const status = hidden === true ? ProductStatus.HIDE : ProductStatus.SHOW;

    const catalogs = catalogId !== 0 ? await this.loadCatalog(storeId, catalogId) : [];
    const catalogIds = catalogs.map(catalog => catalog.get('id_katalog'));
    if (!catalogId || catalogId === 0) {
      // For products without catalog
      catalogIds.push(0);
      if (catalogId !== 0) catalogs.models.push(0);
      else catalogs.push(0);
    }

    const getProducts = this.loadProducts(catalogIds, storeId, !catalogId, status, page, pageSize);
    const getCountProducts = catalogId ? []
      : Product.countProductsByCatalog(catalogIds, storeId, status);
    const [products, countProducts] = await Promise.all([getProducts, getCountProducts]);

    return await Promise.reduce(catalogs.models || catalogs, async (data, catalog, index) => {
      const catalogProducts = [];
      // eslint-disable-next-line no-restricted-syntax
      for (let product of products[index].models) {
        await product.load({ images: qb => qb.limit(1) });
        const images = product.related('images').serialize();
        const dropshipOrigin = !product.get('id_dropshipper') ? false
          : {
            store_id: product.get('id_toko'),
            name: product.get('nama_toko'),
            commission: Product.calculateCommission(product.get('harga_produk'), 'nominal'),
          };
        product = {
          ...product.serialize({ minimal: true }),
          image: images.length ? images[0].file : config.defaultImage.product,
          is_checked: false,
        };
        if (dropshipOrigin) product.dropship_origin = dropshipOrigin;
        catalogProducts.push(product);
      }
      catalog = catalog !== 0 ? catalog.serialize() : { name: 'Tanpa Katalog' };
      if (catalogId === undefined) {
        catalog.count_product = countProducts[index] ? parseNum(countProducts[index].get('count_product')) : 0;
      } else {
        catalog.count_product = catalogProducts.length;
      }
      data.push({ catalog, products: catalogProducts });
      return data;
    }, []);
  }
}

export const Catalog = bookshelf.model('Catalog', CatalogModel);
export default { Catalog };
