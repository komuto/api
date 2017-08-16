import _ from 'lodash';
import slug from 'slug';
import core from '../../core';
import { Address } from '../../address/model';
import { getProductError, errMsg, updateProductError } from './../messages';
import { OTPAddressStatus, OTPAddress } from './../../OTP/model';
import { Store } from './../../store/model/store';
import config from './../../../../config';
import { Dropship, DropshipStatus } from './dropship';
import { ExpeditionProductStatus } from './expedition_product';
import { Expedition } from '../../expedition/model';

const { parseNum, parseDec, parseDate } = core.utils;
const bookshelf = core.postgres.db;

export const ProductStatus = {
  HIDE: 0, // Gudangkan
  SHOW: 1,
};

export const ProductCondition = {
  USED: 0,
  NEW: 1,
};

class ProductModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_produk';
  }

  serialize({ minimal = false, wishlist = false } = {}) {
    const product = {
      id: this.get('id_produk'),
      name: this.get('nama_produk'),
      slug: slug(this.get('nama_produk'), { lower: true, charmap: '' }),
      price: parseDec(this.get('harga_produk')),
      discount: this.get('disc_produk'),
      is_discount: !!this.get('disc_produk'),
      is_wholesaler: this.get('is_grosir'),
      is_dropshipper: this.get('is_dropshiper'),
      weight: this.get('berat_produk'),
    };
    if (wishlist) {
      product.is_liked = true;
      product.is_wholesaler = this.get('is_grosir');
      product.created_at = parseDate(this.get('date_created_produk'));
      product.count_sold = parseNum(this.get('count_sold'));
    }
    if (minimal) return product;
    return {
      ...product,
      category_id: this.get('id_kategoriproduk'),
      store_id: this.get('id_toko'),
      stock: this.get('stock_produk'),
      condition: parseNum(this.get('jenis_produk'), 0),
      description: this.get('deskripsi_produk'),
      attrval: parseNum(this.get('attrval_produk'), 0),
      status: parseNum(this.get('status_produk'), 0),
      is_insurance: parseNum(this.get('asuransi_produk'), 0) === 1,
      margin_dropshipper: this.get('margin_dropshiper'),
      is_dropship: this.get('is_dropshiper'),
      is_wholesaler: this.get('is_grosir'),
      count_sold: parseNum(this.get('count_sold'), 0),
      count_popular: parseNum(this.get('count_populer'), 0),
      count_view: this.relations.view && this.related('view').serialize().ip
        ? this.related('view').serialize().ip.length : 0,
      identifier_brand: this.get('identifier_brand'),
      identifier_catalog: this.get('identifier_katalog'),
      status_at: parseDate(this.get('tglstatus_produk')),
      created_at: parseDate(this.get('date_created_produk')),
    };
  }

  /**
   * Add relation to Store
   */
  store() {
    return this.belongsTo('Store', 'id_toko', 'id_toko');
  }

  /**
   * Add relation to ImageProduct
   */
  images() {
    return this.hasMany('ImageProduct', 'id_produk', 'id_produk');
  }

  /**
   * Add relation to Category
   */
  category() {
    return this.belongsTo('Category', 'id_kategoriproduk', 'id_kategoriproduk');
  }

  /**
   * Add relation to review
   */
  reviews() {
    return this.hasMany('Review', 'id_produk');
  }

  /**
   * Add relation to ExpeditionService
   */
  expeditionServices() {
    return this.belongsToMany('ExpeditionService', 'detil_ekspedisiproduk', 'id_produk', 'id_ekspedisiservice');
  }

  /**
   * Add relation to User
   */
  likes() {
    return this.hasMany('User', 'id_produk').through('Wishlist', 'id_users', 'id_produk', 'id_users');
  }

  wholesale() {
    return this.hasMany('Wholesale', 'id_produk');
  }

  /**
   * Add relation to Discussion
   */
  discussions() {
    return this.hasMany('Discussion', 'id_produk');
  }

  /**
   * Add relation to View
   */
  view() {
    return this.hasOne('View', 'id_produk');
  }

  /**
   * Add relation to Catalog
   */
  catalog() {
    return this.belongsTo('Catalog', 'identifier_katalog');
  }

  /**
   * Add relation to Brand
   */
  brand() {
    return this.belongsTo('Brand', 'identifier_brand');
  }

  /**
   * Get product by id
   */
  static async findById(id) {
    const product = await this.where({ id_produk: id }).fetch();
    if (!product) throw getProductError('product', 'not_found');
    return product.toJSON();
  }

  /**
   * Get products
   */
  static async get(params) {
    const {
      page,
      pageSize,
      query,
      price,
      address,
      userId,
      where,
      is_dropship: isDropship,
      marketplaceId,
    } = params;
    let { sort, other = '', brands, services } = params;

    switch (sort) {
      case 'newest':
        sort = 'date_created_produk';
        break;
      case 'cheapest':
        sort = 'harga_produk';
        break;
      case 'expensive':
        sort = '-harga_produk';
        break;
      case 'selling':
        sort = '-count_sold';
        break;
      default:
        sort = 'date_created_produk';
        break;
    }

    other = other.split(',').reduce((result, type) => {
      if (type === 'wholesaler') where.is_grosir = true;
      else result[type] = true;
      return result;
    }, {});
    const products = await this.where(where)
      .query((qb) => {
        qb.select(['produk.*', 'toko.*']);
        qb.innerJoin('toko', 'toko.id_toko', 'produk.id_toko');
        qb.innerJoin('users', 'toko.id_users', 'users.id_users');
        qb.where('users.id_marketplaceuser', marketplaceId);
        if (query) qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        if (price && price.min !== 0 && price.max !== 0) qb.whereBetween('harga_produk', [price.min, price.max]);
        if (address) {
          qb.innerJoin('alamat_users', 'alamat_users.id_users', 'users.id_users');
          qb.where({ alamat_originjual: 1, id_kotakab: address });
        }
        if (other.verified) {
          qb.innerJoin('otp_address', 'otp_address.id_users', 'users.id_users');
          qb.where('status_otpaddress', OTPAddressStatus.VERIFIED);
        }
        if (other.discount) qb.where('disc_produk', '>', 0);
        if (brands) {
          brands = brands.split(',');
          qb.whereIn('identifier_brand', brands);
        }
        if (services) {
          services = services.split(',');
          qb.innerJoin('detil_ekspedisiproduk', 'detil_ekspedisiproduk.id_produk', 'produk.id_produk');
          qb.whereIn('detil_ekspedisiproduk.id_ekspedisiservice', services);
        }
        if (isDropship) qb.where('is_dropshiper', JSON.parse(isDropship));
      })
      .orderBy(sort)
      .orderBy('id_produk')
      .fetchPage({
        page,
        pageSize,
        withRelated: ['likes', 'view', 'images'],
      });

    let verified;
    if (!other.verified) {
      // Get all otp addresses, then iterate over those
      // then check which store is verified and which don't
      verified = await Promise.all(products.models.map(product => OTPAddress.where({
        id_users: product.get('id_users'),
        status_otpaddress: OTPAddressStatus.VERIFIED,
      }).fetch()));
    }

    return products.models.reduce((results, product, index) => {
      const store = {
        ...Store.prototype.serialize.call(product),
        is_verified: other.verified || !!verified[index],
      };
      const images = product.related('images');
      const likes = product.related('likes');
      const isLiked = userId ? _.find(likes.models, o => o.attributes.id_users === userId) : false;
      product = product.serialize();
      product.image = images.length ?
        images.models[0].serialize().file : config.defaultImage.product;
      product.count_like = likes.length;
      product.is_liked = !!isLiked;
      if (isDropship) product.commission = this.calculateCommission(product.price, 'percent');
      results.push({ product, store });
      return results;
    }, []);
  }

  static calculateCommission(price, type) {
    let fee;
    if (price <= 200000 && price > 0) fee = 0.025;
    else if (price <= 500000) fee = 0.02;
    else if (price <= 1000000) fee = 0.015;
    else if (price <= 5000000) fee = 0.01;
    else if (price <= 10000000) fee = 0.005;
    const feeTotal = price * fee;
    if (type === 'nominal') return feeTotal;
    else if (type === 'percent') return 100 / (price / feeTotal);
    throw new Error('Choose commission type!');
  }

  /**
   * Get search result
   */
  static async search(query = null) {
    return await this.query((qb) => {
      qb.select('nama_produk');
      qb.groupBy('nama_produk');
      qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
    }).fetchAll();
  }

  static loadExpeditions(product) {
    // checking whether expedition id is already in the list or not
    const checker = [];
    return product.related('expeditionServices')
      .reduce((res, service) => {
        const expeditionId = service.get('id_ekspedisi');
        if (!checker.includes(expeditionId)) {
          const expedition = service.related('expedition').serialize({ minimal: true });
          checker.push(expeditionId);
          res.push(expedition);
        }
        return res;
      }, []);
  }

  static loadReviewsRatings(product) {
    const accSum = [0, 0];
    const qtySum = [0, 0];
    const reviews = product.related('reviews').map((review) => {
      const { name, id: userId, photo } = review.related('user').serialize();
      review = review.serialize();
      const { quality, accuracy } = review;
      this.ratingSum(accSum, accuracy);
      this.ratingSum(qtySum, quality);
      return {
        ...review,
        user: { id: userId, name, photo },
      };
    });
    return { reviews, rating: { accuracy: accSum, quality: qtySum } };
  }

  static loadLikes(product, id) {
    const likes = product.related('likes');
    const isLiked = !!_.find(likes.models, o => o.get('id_users') === id);
    return { likes, isLiked };
  }

  static loadFavorites(store, id) {
    const favorites = store.related('favoriteStores');
    return !!_.find(favorites.models, o => o.get('id_users') === id);
  }

  /**
   * Adding to be averaged later
   * @param ref [array] array reference
   * @param rating [integer]
   */
  static ratingSum(ref, rating) {
    if (rating) {
      ref[0] += rating;
      ref[1] += 1;
    }
  }

  static ratingAvg(res) {
    // if there is no rating
    if (res[1] === 0) return 0;

    res = (res[0] / res[1]).toFixed(1);
    // e.g.: if the rating is 5.0 change it to 5
    if (res[2] === '0') res = res[0];
    return res;
  }

  /**
   * Get product with its relation
   * @param productId {integer} product id
   * @param userId {integer} user id
   */
  static async getFullProduct(productId, userId) {
    const related = [
      'category',
      'images',
      'reviews.user.addresses',
      'expeditionServices.expedition',
      'likes',
      'discussions',
      'view',
      { 'store.verifyAddress': qb => qb.where('status_otpaddress', OTPAddressStatus.VERIFIED) },
    ];
    if (userId) related.push('store.favoriteStores');
    let product = await this.where({ id_produk: productId }).fetch({ withRelated: related });
    if (!product) return false;
    // Eager load other products so it doesn't block other process by not awaiting directly
    const getOtherProds = this.query((qb) => {
      qb.where('id_toko', product.get('id_toko'));
      qb.whereNot('id_produk', productId);
      qb.orderBy('id_produk', 'desc');
      qb.limit(3);
    }).fetchAll({ withRelated: ['likes', { images: qb => qb.limit(1) }] });

    let wholesaler;
    if (product.get('is_grosir')) {
      await product.load('wholesale').catch(() => {
        throw getProductError('product', 'error');
      });
      wholesaler = product.related('wholesale').serialize();
    } else wholesaler = [];

    const category = product.related('category').serialize();
    let store = product.related('store');
    const isFavorite = userId ? this.loadFavorites(store, userId) : false;
    store = store.serialize({ verified: true });
    const images = product.related('images');
    const getAddress = Address.getStoreAddress(store.user_id);
    const expeditions = this.loadExpeditions(product);
    const { reviews, rating } = this.loadReviewsRatings(product);
    const { likes, isLiked } = this.loadLikes(product, userId);
    const discussions = product.related('discussions');

    rating.quality = parseFloat(this.ratingAvg(rating.quality));
    rating.accuracy = parseFloat(this.ratingAvg(rating.accuracy));
    product = product.serialize();
    product.count_review = reviews.length;
    product.count_like = likes.length;
    product.is_liked = isLiked;
    product.count_discussion = discussions.length;
    const address = await getAddress;
    store.is_favorite = isFavorite;
    store.province = address.related('province').serialize();
    store.district = address.related('district').serialize();
    let otherProds = await getOtherProds;
    otherProds = otherProds.map((otherProduct) => {
      const { likes: like, isLiked: liked } = this.loadLikes(otherProduct, userId);
      const otherImages = otherProduct.related('images').serialize();
      const image = otherImages.length ? otherImages[0].file : config.defaultImage.product;
      return {
        ...otherProduct.serialize({ minimal: true }),
        count_like: like.length,
        is_liked: liked,
        image,
      };
    });

    return {
      product,
      category,
      store,
      images,
      reviews,
      rating,
      wholesaler,
      other_products: otherProds,
      expeditions,
    };
  }

  /**
   * Get product with its relation
   * @param productId {integer} product id
   * @param storeId {integer} store id
   */
  static async getFullOwnProduct(productId, storeId) {
    let isDropship = false;
    const where = { id_produk: productId, id_toko: storeId };
    const related = {
      withRelated: [
        'category',
        'images',
        'expeditionServices.expedition',
        'brand',
        'catalog',
      ],
    };
    let product = await this.where(where).fetch(related);
    let dropship;
    if (!product) {
      dropship = await Dropship.where(where).fetch({ withRelated: ['catalog'] });
      if (!dropship) return false;
      product = await this.where({ id_produk: dropship.get('id_produk') }).fetch(related);
      isDropship = true;
    }

    let wholesaler;
    if (product.get('is_grosir')) {
      await product.load('wholesale').catch(() => {
        throw getProductError('product', 'error');
      });
      wholesaler = product.related('wholesale').serialize();
    } else wholesaler = [];

    const category = product.related('category');
    const images = product.related('images');
    const expeditionServices = product.related('expeditionServices').map((service) => {
      const expedition = service.related('expedition');
      return `${expedition.serialize().name} ${service.serialize().name}`;
    });
    let catalog;
    if (isDropship) {
      catalog = dropship.get('id_katalog') ? dropship.related('catalog') : null;
    } else {
      catalog = product.get('identifier_katalog') ? product.related('catalog') : null;
    }
    const brand = product.get('identifier_brand') ? product.related('brand') : null;

    return {
      product,
      category,
      images,
      wholesaler,
      catalog,
      brand,
      expedition_services: expeditionServices,
    };
  }

  /**
   * Get ids product by store id
   */
  static async getIdsByStoreId(storeId) {
    const products = await this.where({ id_toko: storeId }).fetchAll();
    return products.map(product => (product.get('id_produk')));
  }

  /**
   * Get expedition and service
   */
  static async getExpeditionsById(id) {
    const product = await this.where({ id_produk: id }).fetch({ withRelated: ['expeditionServices.expedition'] });
    let services = product.related('expeditionServices');
    services = services.map((val) => {
      const service = val.serialize();
      return {
        ...service,
        expedition: service.expedition.serialize(),
      };
    });

    const groups = _.groupBy(services, val => (val.expedition.name));

    return _.map(groups, (group, key) => ({
      expedition: key,
      expedition_id: group[0].expedition.id,
      services: group,
    }));
  }

  static async countProductsByCatalog(catalogIds, storeId, status) {
    const dropshipStatus = DropshipStatus.SELECTED;
    const productStatus = status;
    return await Promise.all(catalogIds.map(id => this.query((qb) => {
      qb.count('produk.id_produk as count_product');
      qb.leftJoin('dropshipper as d', 'produk.id_produk', 'd.id_produk');
      qb.where('d.id_toko', storeId).andWhere('produk.status_produk', productStatus);
      qb.where('status_dropshipper', dropshipStatus);
      if (id !== 0) qb.where('d.id_katalog', id);
      else qb.whereNull('d.id_katalog');
      qb.orWhere('produk.id_toko', storeId).andWhere('produk.status_produk', productStatus);
      if (id !== 0) qb.where('identifier_katalog', id);
      else qb.whereNull('identifier_katalog');
    }).fetch()));
  }

  /**
   * Hide products
   * @param storeId
   * @param ids
   */
  static async hides(storeId, ids) {
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      const product = await this.where({ id_toko: storeId, id_produk: id }).fetch().catch(() => {});
      // eslint-disable-next-line no-continue
      if (!product) continue;
      const status = parseNum(product.toJSON().status) === ProductStatus.HIDE
        ? ProductStatus.SHOW : ProductStatus.HIDE;
      await this.where({ id_toko: storeId, id_produk: id })
        .save({ status_produk: status }, { patch: true }).catch(() => {});
    }
  }

  /**
   * Move catalog products
   * @param storeId
   * @param ids
   * @param catalogId
   */
  static async moveCatalog(storeId, ids, catalogId) {
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      await this.where({ id_toko: storeId, id_produk: id })
        .save({ identifier_katalog: catalogId }, { patch: true }).catch(() => {});
    }
  }

  /**
   * Delete products
   * @param storeId
   * @param ids
   */
  static async bulkDelete(storeId, ids) {
    const errors = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      await this.where({ id_toko: storeId, id_produk: id }).destroy().catch((err) => {
        if (err) errors.push({ product_id: id, error: errMsg.bulkDeleteProduct.error });
      });
    }
    return errors;
  }

  /**
   * Update product
   */
  static async update(id, storeId, data) {
    const product = await this.where({ id_produk: id, id_toko: storeId }).fetch();
    if (!product) throw getProductError('product', 'not_found');
    await product.save(data, { patch: true }).catch(() => {
      throw updateProductError('product', 'error');
    });
    return await product.refresh();
  }

  /**
   * Get list expedition service
   * @param id {integer} product id
   * @param storeId {integer} store id
   */
  static async getProductExpeditionsManage(id, storeId) {
    const expeditions = [];
    const expeditionIds = [];
    const expeditionServiceIds = [];
    const product = await this.where({ id_produk: id, id_toko: storeId }).fetch({
      withRelated: [
        {
          expeditionServices: (qb) => {
            qb.where('status_detilekspedisiproduk', ExpeditionProductStatus.USED);
          },
        },
        'expeditionServices.expedition',
      ],
    });
    const expeditionServices = product.related('expeditionServices');
    expeditionServices.each((service) => {
      const expedition = service.related('expedition').serialize();
      const found = _.find(expeditions, { id: expedition.id });
      service = service.serialize();
      service.is_checked = true;
      service.is_active = true;
      expeditionServiceIds.push(service.id);
      if (found === undefined) {
        expeditionIds.push(expedition.id);
        expedition.services = [service];
        return expeditions.push(expedition);
      }
      return found.services.push(service);
    });
    const dataExpeditions = await Expedition.query(qb => qb.whereIn('id_ekspedisi', expeditionIds))
      .fetchAll({
        withRelated: [{ services: qb => qb.whereNotIn('id_ekspedisiservice', expeditionServiceIds) }] });
    dataExpeditions.each((val) => {
      const expedition = _.find(expeditions, { id: val.serialize().id });
      const services = val.related('services').map((o) => {
        o = o.serialize();
        o.expedition = val.serialize();
        o.is_active = false;
        return o;
      });
      expedition.services.push(...services);
      expedition.services = _.sortBy(expedition.services, 'id');
    });
    return expeditions;
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      name: 'nama_produk',
      store_id: 'id_toko',
      category_id: 'id_kategoriproduk',
      brand_id: 'identifier_brand',
      description: 'deskripsi_produk',
      price: 'harga_produk',
      weight: 'berat_produk',
      stock: 'stock_produk',
      condition: 'jenis_produk',
      is_insurance: 'asuransi_produk',
      is_dropship: 'is_dropshiper',
      is_wholesaler: 'is_grosir',
      discount: 'disc_produk',
      catalog_id: 'identifier_katalog',
      other_attr: 'attrval_produk',
      date_created: 'date_created_produk',
      date_status: 'tglstatus_produk',
      status: 'status_produk',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop] && data[prop] !== undefined) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Product = bookshelf.model('Product', ProductModel);
export default { Product, ProductCondition };
