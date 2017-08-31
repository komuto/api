import core from '../../core';
import { createCatalogError, getCatalogError, updateCatalogError } from './../messages';
import config from './../../../../config';
import { ProductStatus, DropshipStatus, Product, ImageProduct, MasterFee } from '../../product/model';

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
    const catalog = await this.where({ id_katalog: id }).fetch({
      withRelated: { products: qb => qb.column('identifier_katalog') },
    });
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

  static async loadProduct(id, storeId, status, offset, limit) {
    const whereDropship = { 'd.id_toko': storeId, status_dropshipper: status };
    const whereProduct = { id_toko: storeId, status_produk: status };

    if (id !== null) {
      whereDropship['d.id_katalog'] = id === 0 ? null : id;
      whereProduct.identifier_katalog = id === 0 ? null : id;
    }

    return knex.select(knex.raw('"p".*, "d"."id_dropshipper", "nama_toko"'))
      .from('dropshipper as d')
      .join('produk as p', 'p.id_produk', 'd.id_produk')
      .join('toko as t', 'p.id_toko', 't.id_toko')
      .where(whereDropship)
      .union(function () {
        this.select(knex.raw('*, null as id_dropshipper, null as nama_toko'))
          .from('produk')
          .where(whereProduct);
      })
      .orderBy('id_produk', 'DESC')
      .limit(limit)
      .offset(offset)
      .then(products => products);
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
    const { storeId, catalogId, page = 1, pageSize = 10, marketplaceId } = params;
    const status = ProductStatus.SHOW;
    const limit = catalogId === undefined ? 3 : pageSize;
    const offset = page === 1 || catalogId === undefined ? 0 : (page - 1) * pageSize;

    const catalogs = catalogId !== 0 ? await this.loadCatalog(storeId, catalogId) : { models: [0] };
    const catalogIds = catalogId !== 0 ? catalogs.map(catalog => catalog.get('id_katalog')) : [];
    if (!catalogId || catalogId === 0) {
      // For products without catalog
      catalogIds.push(0);
      if (!catalogId && catalogId !== 0) catalogs.models.push(0);
    }

    // Create getter object so that knex object could be serialized using Product model
    const getter = {
      get(prop) { return this[prop]; },
    };
    const getProducts = await Promise.all(
      catalogIds.map(id => this.loadProduct(id, storeId, status, offset, limit)),
    );
    const getCountProducts = catalogId ? []
      : Product.countProductsByCatalog(catalogIds, storeId, status);
    const [productsCatalog, countProducts] = await Promise.all([getProducts, getCountProducts]);
    const getImages = productsCatalog.map(
      products => Promise.all(
        products.map(product => ImageProduct.where('id_produk', product.id_produk).fetch()),
      ),
    );
    const masterFee = await MasterFee.findByMarketplaceId(marketplaceId);

    return await Promise.all(productsCatalog.map(async (products, index) => {
      const images = await getImages[index];
      const catalogProducts = products.map((product, idx) => {
        const image = images[idx] ? images[idx].serialize().file : config.defaultImage.product;
        const dropshipOrigin = !product.id_dropshipper ? false
          : {
            store_id: product.id_toko,
            name: product.nama_toko,
            commission: MasterFee.calculateCommissionByFees(
              masterFee,
              parseNum(product.harga_produk),
              ),
          };
        // Initialize prototype chain
        Object.setPrototypeOf(product, getter);
        product = {
          ...Product.prototype.serialize.call(product, { minimal: true }),
          image,
          is_checked: false,
        };
        if (dropshipOrigin) product.dropship_origin = dropshipOrigin;
        return product;
      });
      let catalog = catalogs.models[index];
      catalog = catalog !== 0 ? catalog.serialize() : { name: 'Tanpa Katalog' };
      if (catalogId === undefined) {
        catalog.count_product = countProducts[index] || 0;
      } else {
        catalog.count_product = catalogProducts.length;
      }
      return { catalog, products: catalogProducts };
    }));
  }
}

export const Catalog = bookshelf.model('Catalog', CatalogModel);
export default { Catalog };
