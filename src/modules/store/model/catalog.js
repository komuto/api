import core from '../../core';
import { createCatalogError, getCatalogError, updateCatalogError } from './../messages';
import config from './../../../../config';
import { MasterFee } from '../../product/model';
import { Product, ProductStatus } from '../../product/model/product';

const bookshelf = core.postgres.db;
const knex = core.postgres.knex;
const { parseDate, defaultNull, getter } = core.utils;
const PRODUCT_IMAGE_PATH = config.imageFolder.product;

class CatalogModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'katalog';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_katalog';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
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
    const catalogs = await this.where({ id_toko: storeId }).fetchAll();
    const catalogIds = catalogs.map(catalog => catalog.get('id_katalog'));
    const countProducts = await Product.countProductsByCatalog(catalogIds, storeId);
    return catalogs.map((catalog, i) => ({
      ...catalog.serialize(),
      count_product: countProducts[i],
    }));
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

    const select = [
      'p.id_produk',
      'p.id_toko',
      'p.nama_produk',
      'p.harga_produk',
      'p.disc_produk',
      'p.is_grosir',
      'p.is_dropshiper',
      'p.berat_produk',
      'p.stock_produk',
      'p.date_created_produk',
      'p.count_sold',
      'p.id_kategoriproduk',
      'p.jenis_produk',
      'p.deskripsi_produk',
      'p.attrval_produk',
      'p.status_produk',
      'p.asuransi_produk',
      'p.margin_dropshiper',
      'p.count_populer',
      'p.identifier_brand',
      'p.identifier_katalog',
      'p.tglstatus_produk',
      'p.date_created_produk',
      'd.id_dropshipper',
      'nama_toko',
      'file_gambarproduk',
    ];

    const select2 = [
      'produk.id_produk',
      'produk.id_toko',
      'produk.nama_produk',
      'produk.harga_produk',
      'produk.disc_produk',
      'produk.is_grosir',
      'produk.is_dropshiper',
      'produk.berat_produk',
      'produk.stock_produk',
      'produk.date_created_produk',
      'produk.count_sold',
      'produk.id_kategoriproduk',
      'produk.jenis_produk',
      'produk.deskripsi_produk',
      'produk.attrval_produk',
      'produk.status_produk',
      'produk.asuransi_produk',
      'produk.margin_dropshiper',
      'produk.count_populer',
      'produk.identifier_brand',
      'produk.identifier_katalog',
      'produk.tglstatus_produk',
      'produk.date_created_produk',
      'null as id_dropshipper',
      'null as nama_toko',
      'file_gambarproduk',
    ];

    return knex.select(knex.raw(select.join(',')))
      .from('dropshipper as d')
      .join('produk as p', 'p.id_produk', 'd.id_produk')
      .join('toko as t', 'p.id_toko', 't.id_toko')
      .joinRaw('join (select DISTINCT ON (id_produk) id_produk, file_gambarproduk FROM gambar_produk) as images ON images.id_produk = p.id_produk')
      .where(whereDropship)
      .union(function () {
        this.select(knex.raw(select2.join(',')))
          .from('produk')
          .joinRaw('join (select DISTINCT ON (id_produk) id_produk, file_gambarproduk FROM gambar_produk) as images ON images.id_produk = produk.id_produk')
          .where(whereProduct);
      })
      .orderBy('id_produk', 'DESC')
      .limit(limit)
      .offset(offset)
      .then(products => products);
  }

  static loadCatalog(storeId, catalogId) {
    const query = { id_toko: storeId };
    if (catalogId) query.id_katalog = catalogId;
    return this.where(query).fetchAll();
  }

  /**
   * Get catalog with products
   */
  static async getCatalogWithProducts(params, domain) {
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

    const getProducts = await Promise.all(
      catalogIds.map(id => this.loadProduct(id, storeId, status, offset, limit)),
    );
    const getCountProducts = catalogId ? []
      : Product.countProductsByCatalog(catalogIds, storeId, status);
    const [productsCatalog, countProducts] = await Promise.all([getProducts, getCountProducts]);
    const masterFee = await MasterFee.findByMarketplaceId(marketplaceId);

    return await Promise.all(productsCatalog.map(async (products, index) => {
      const catalogProducts = products.map((product) => {
        const image = product.file_gambarproduk
          ? core.imagePath(domain, PRODUCT_IMAGE_PATH, product.file_gambarproduk)
          : config.defaultImage.product;
        const dropshipOrigin = !product.id_dropshipper ? false
          : {
            store_id: product.id_toko,
            name: product.nama_toko,
            commission: {
              nominal: MasterFee.calculateCommissionByFees(masterFee, Number(product.harga_produk)),
              percent: MasterFee.calculateCommissionByFees(
                masterFee,
                Number(product.harga_produk),
                true,
              ),
            },
          };
        // Provide this.get() utility for serialize
        Object.setPrototypeOf(product, getter);
        product = {
          ...Product.prototype.serialize.call(product, { minimal: true }),
          image,
          commission: MasterFee.calculateCommissionByFees(
            masterFee,
            Number(product.harga_produk),
            true,
            false,
          ),
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
