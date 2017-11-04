import _ from 'lodash';
import slug from 'slug';
import core from '../../core';
import { Address } from '../../address/model';
import { getProductError, errMsg, updateProductError } from './../messages';
import { Store, StoreVerificationStatus } from '../../store/model/store';
import config from './../../../../config';
import { Dropship, DropshipStatus } from './dropship';
import { ProductExpeditionStatus } from './product_expedition';
import { MasterFee } from './master_fee';
import { View } from './view';
import { Wishlist } from '../../user/model/wishlist';
import { Review } from '../../review/model';
import { StoreExpeditionStatus } from '../../store/model/store_expedition';
import { Discussion } from './discussion';

const { parseNum, parseDec, parseDate, getter, matchDB } = core.utils;
const bookshelf = core.postgres.db;
const knex = bookshelf.knex;
const IMAGE_PATH = config.imageFolder.product;

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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ minimal = false, wishlist = false, alterId = false } = {}) {
    const product = {
      id: !alterId ? this.get('id_produk') : `${this.get('id_produk')}.` +
        // if alterId is number then use that instead of id_toko
        `${(typeof alterId === 'number' && alterId) || this.get('id_toko')}`,
      name: this.get('nama_produk'),
      slug: slug(this.get('nama_produk'), { lower: true, charmap: '' }),
      price: parseDec(this.get('harga_produk')),
      discount: this.get('disc_produk'),
      is_discount: !!this.get('disc_produk'),
      is_wholesaler: this.get('is_grosir'),
      is_dropship: this.get('is_dropshiper'),
      weight: this.get('berat_produk'),
      stock: this.get('stock_produk'),
      image: !this.relations || !this.relations.image ? undefined
        : core.imagePath(IMAGE_PATH, this.related('image').get('file_gambarproduk')),
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
      condition: parseNum(this.get('jenis_produk'), 0),
      description: this.get('deskripsi_produk'),
      attrval: parseNum(this.get('attrval_produk'), 0),
      status: parseNum(this.get('status_produk'), 0),
      is_insurance: parseNum(this.get('asuransi_produk'), 0) === 1,
      margin_dropshipper: this.get('margin_dropshiper'),
      is_wholesaler: this.get('is_grosir'),
      count_sold: parseNum(this.get('count_sold'), 0),
      count_popular: parseNum(this.get('count_populer'), 0),
      count_view: this.relations && this.relations.view
      && this.related('view').serialize().ip
        ? this.related('view').serialize().ip.length : 0,
      brand_id: this.get('identifier_brand'),
      catalog_id: this.get('identifier_katalog'),
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

  image() {
    return this.hasOne('ImageProduct', 'id_produk');
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
   * Add relation to Wishlist
   */
  likes() {
    return this.hasMany('Wishlist', 'id_produk');
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

  static addWhereClause(products, params, isFromProduct) {
    const {
      query,
      price,
      address,
      where,
      storeId,
      isDropship,
      other,
      catalogId,
      marketplaceId,
    } = params;
    let { brands, services } = params;

    products.where(where).andWhere('u.id_marketplaceuser', marketplaceId);
    products.where(isFromProduct ? 'p.status_produk' : 'd.status_dropshipper', ProductStatus.SHOW);
    if (isDropship) products.whereNot('p.id_toko', storeId).andWhere('is_dropshiper', true);
    if (!isDropship && storeId) products.where(isFromProduct ? 'p.id_toko' : 'd.id_toko', storeId);
    if (catalogId) {
      const column = isFromProduct ? 'p.identifier_katalog' : 'd.id_katalog';
      if (catalogId === '0') {
        products.whereNull(column, catalogId);
      } else {
        products.where(column, catalogId);
      }
    }
    if (query) products.whereRaw('to_tsvector(nama_produk) @@ to_tsquery(?)', query);
    if (price && price.min !== 0 && price.max !== 0) products.whereBetween('harga_produk', [price.min, price.max]);
    if (address) {
      products.innerJoin('alamat_users as au', 'au.id_users', 'u.id_users');
      products.where({ alamat_originjual: 1, id_kotakab: address });
    }
    if (other.verified) {
      products.where('verification_status', StoreVerificationStatus.VERIFIED);
    }
    if (other.discount) products.where('disc_produk', '>', 0);
    if (brands) {
      brands = brands.split(',');
      products.whereIn('identifier_brand', brands);
    }
    if (services) {
      services = services.split(',');
      products.innerJoin('detil_ekspedisiproduk as de', 'de.id_produk', 'p.id_produk');
      products.whereIn('de.id_ekspedisiservice', services);
    }
    return products;
  }

  static async getProducts(params) {
    const { page, pageSize, sort } = params;
    const offset = page <= 1 ? 0 : (page - 1) * pageSize;
    const self = this;

    const fromProduct = knex
      .select([
        'p.*',
        'tglstatus_produk as date_created',
        't.*',
        'file_gambarproduk',
        'p.identifier_katalog as identifier_katalog',
      ])
      .select(knex.raw('null as "id_dropshipper"'))
      .select(knex.raw('COALESCE("p"."count_sold", 0) as "p_count_sold"'))
      .from('produk as p')
      .join('toko as t', 'p.id_toko', 't.id_toko')
      .join('users as u', 't.id_users', 'u.id_users')
      .joinRaw('join (select DISTINCT ON (id_produk) id_produk, file_gambarproduk FROM gambar_produk) as images ON images.id_produk = p.id_produk');

    return self.addWhereClause(fromProduct, params, true)
      .union(function () {
        const fromDropship = this
          .select([
            'p.*',
            'tglstatus_dropshipper as date_created',
            't.*',
            'file_gambarproduk',
            'd.id_katalog as identifier_katalog',
            'd.id_dropshipper',
          ])
          .select(knex.raw('COALESCE("d"."count_sold", 0) as "p_count_sold"'))
          .from('dropshipper as d')
          .join('produk as p', 'd.id_produk', 'p.id_produk')
          .join('toko as t', 'd.id_toko', 't.id_toko')
          .join('users as u', 't.id_users', 'u.id_users')
          .joinRaw('join (select DISTINCT ON (id_produk) id_produk, file_gambarproduk FROM gambar_produk) as images ON images.id_produk = p.id_produk');
        self.addWhereClause(fromDropship, params, false);
      })
      .orderBy(sort.column, sort.by)
      .limit(pageSize)
      .offset(offset)
      .then(products => products);
  }

  /**
   * Get products
   */
  static async get(params) {
    const {
      userId,
      where,
      marketplaceId,
      isDropship,
    } = params;
    let { sort, other = '' } = params;

    switch (sort) {
      case 'cheapest':
        sort = { column: 'harga_produk', by: 'asc' };
        break;
      case 'expensive':
        sort = { column: 'harga_produk', by: 'desc' };
        break;
      case 'selling':
        sort = { column: 'p_count_sold', by: 'desc' };
        break;
      default:
        sort = { column: 'date_created', by: 'desc' };
    }

    other = other.split(',').reduce((result, type) => {
      if (type === 'wholesaler') where.is_grosir = true;
      else result[type] = true;
      return result;
    }, {});

    const products = await this.getProducts({ ...params, sort, other, where });
    const getRelations = products.map((product) => {
      const id = product.id_produk;
      const dropshipperId = product.id_dropshipper;
      const getViews = View.where({ id_produk: id, id_dropshipper: dropshipperId }).fetch();
      return Promise.all([getViews, ...this.getLike(product, userId, false)]);
    });

    const masterFee = await MasterFee.findByMarketplaceId(marketplaceId);

    return await Promise.all(products.map(async (product, index) => {
      const image = product.file_gambarproduk
        ? core.imagePath(IMAGE_PATH, product.file_gambarproduk)
        : config.defaultImage.product;
      // Provide this.get() utility for serialize
      Object.setPrototypeOf(product, getter);
      const [view, countLike, isLiked] = await getRelations[index];
      const store = Store.prototype.serialize.call(product);
      const countSold = product.p_count_sold;

      product = this.prototype.serialize.call(product);
      product.id = `${product.id}.${store.id}`;
      product.image = image;
      product.count_view = view ? view.serialize().ip.length : 0;
      product.count_like = parseNum(countLike);
      product.is_liked = !!isLiked;
      product.count_sold = parseNum(countSold);
      if (userId && isDropship) {
        product.commission = MasterFee.calculateCommissionByFees(masterFee, product.price, true);
      }
      return { product, store };
    }));
  }

  /**
   * Get search result
   */
  static async search(data) {
    const {
      query,
      category_id: categoryId = null,
      catalog_id: catalogId = null,
      store_id: storeId = null,
      marketplace_id: marketplaceId,
    } = data;
    return await this.query((qb) => {
      qb.select('nama_produk');
      qb.innerJoin('toko as t', 't.id_toko', 'produk.id_toko');
      qb.innerJoin('users as u', 'u.id_users', 't.id_users');
      qb.where('u.id_marketplaceuser', marketplaceId);
      qb.where('status_produk', ProductStatus.SHOW);
      qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
      if (categoryId) qb.where('id_kategoriproduk', categoryId);
      if (catalogId) qb.where('identifier_katalog', catalogId);
      if (storeId) qb.where('produk.id_toko', storeId);
      qb.union(function () {
        const dropship = this.select('p.nama_produk')
          .from('produk as p')
          .leftJoin('dropshipper as d', 'd.id_produk', 'p.id_produk')
          .innerJoin('toko as td', 'td.id_toko', 'd.id_toko')
          .innerJoin('users as ud', 'ud.id_users', 'td.id_users')
          .where('ud.id_marketplaceuser', marketplaceId)
          .where('status_dropshipper', ProductStatus.SHOW)
          .whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        if (categoryId) dropship.where('id_kategoriproduk', categoryId);
        if (catalogId) dropship.where('id_katalog', catalogId);
        if (storeId) dropship.where('d.id_toko', storeId);
      });
      qb.groupBy('nama_produk');
      qb.limit(8);
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

  static loadReviewsRatings(getReviews) {
    const accSum = [0, 0];
    const qtySum = [0, 0];
    const reviews = getReviews.map((review) => {
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
   * @param id {int} store id
   * @param limit {int}
   * @param isImage {boolean}
   * @param productWhere {function} add where clause to product query
   * @param dropshipWhere {function} add where clause to dropship query
   */
  static getStoreProducts(id, limit, isImage = false, productWhere = false, dropshipWhere = false) {
    const withRelated = isImage ? 'image' : null;
    return this.query((qb) => {
      qb.select(['*', 'tglstatus_produk as date_created', 'id_toko']);
      qb.select(knex.raw('null as "id_dropshipper"'));
      qb.where('produk.id_toko', id).andWhere('status_produk', ProductStatus.SHOW);
      if (productWhere) productWhere(qb);
      qb.union(function () {
        this.select(['p.*', 'd.tglstatus_dropshipper as date_created', 'd.id_toko', 'id_dropshipper'])
          .from('produk as p')
          .leftJoin('dropshipper as d', 'd.id_produk', 'p.id_produk')
          .where('d.id_toko', id);
        if (dropshipWhere) dropshipWhere(this);
      });
      qb.orderBy('date_created', 'desc');
      qb.limit(limit);
    }).fetchAll({ withRelated });
  }

  /**
   * Get product with its relation
   * @param productId {integer} product id
   * @param storeId {integer} store id
   * @param userId {integer} user id
   */
  static async getFullProduct(productId, storeId, userId) {
    let dropship;
    let isDropshipped = false;
    let getViewDropship = false;
    const related = [
      'category',
      'images',
      'discussions',
      'expeditionServices.expedition',
      'store',
      { expeditionServices: qb => qb.where('status_detilekspedisiproduk', ProductExpeditionStatus.USED) },
    ];
    let product = await this.where({ id_produk: productId }).fetch({ withRelated: related });
    if (product && product.get('id_toko') !== storeId) {
      const withRelated = ['store'];
      if (userId) withRelated.push('store.favoriteStores');
      dropship = await Dropship.findByProductIdAndStoreId(productId, storeId, withRelated);
      if (!dropship) return false;
      isDropshipped = true;
    }
    const idDropship = isDropshipped ? dropship.get('id_dropshipper') : undefined;

    let getReviews = Review
      .where({ id_produk: productId, id_dropshipper: idDropship || null })
      .query(qb => qb.limit(3))
      .fetchAll({ withRelated: 'user' });

    let countDiscussion;
    if (isDropshipped) {
      countDiscussion = Discussion.query(qb => qb.where('id_produk', productId).where('id_toko', storeId)).count();
    } else {
      countDiscussion = Discussion.query(qb => qb.where('id_produk', productId).whereNull('id_dropshipper')).count();
    }

    // Eager load other products so it doesn't block other process by not awaiting directly
    let otherProds = this.getStoreProducts(
      storeId,
      3,
      true,
      qb => qb.whereNot('produk.id_produk', productId),
      qb => qb.whereNot('d.id_produk', productId),
    );

    let getStore;
    if (!isDropshipped) {
      const load = ['view'];
      if (userId) load.push('store.favoriteStores');
      getStore = product.load(load);
    } else {
      getStore = false;
      getViewDropship = product.load({ view: qb => qb.where('id_dropshipper', idDropship) });
    }
    let getWholesaler = !product.get('is_grosir') ? false
      : product.load('wholesale').catch(() => { throw getProductError('product', 'error'); });
    const category = product.related('category').serialize();
    let address = Address.getStoreAddress(product.related('store').get('id_users'));

    [
      address,
      countDiscussion,
      otherProds,
    ] = await Promise.all([address, countDiscussion, otherProds]);

    const location = { province: address.related('province'), district: address.related('district') };
    const expeditions = this.loadExpeditions(product);

    getStore = getStore !== false && await getStore;
    let store = getStore !== false ? product.related('store') : dropship.related('store');
    const isFavorite = userId ? this.loadFavorites(store, userId) : false;
    store = store.serialize({ verified: true });
    const otherLikes = otherProds.map(prod => this.getLike(prod, userId));

    getWholesaler = getWholesaler !== false && await getWholesaler;
    const wholesaler = getWholesaler === false ? [] : product.related('wholesale').serialize();
    store.is_favorite = isFavorite;
    getReviews = await getReviews;
    const { reviews, rating } = this.loadReviewsRatings(getReviews);
    rating.quality = parseFloat(this.ratingAvg(rating.quality));
    rating.accuracy = parseFloat(this.ratingAvg(rating.accuracy));
    const [countLike, isLiked] = await Promise.all(this.getLike(product, userId));
    await getViewDropship;
    const images = product.related('images');

    product = {
      ...product.serialize(),
      store_id: storeId,
      count_review: reviews.length,
      count_like: parseNum(countLike),
      is_liked: !!isLiked,
      count_discussion: parseNum(countDiscussion),
    };
    product.id = `${product.id}.${storeId}`;
    product.count_sold = isDropshipped ? parseNum(dropship.get('count_sold')) : product.count_sold;

    otherProds = await Promise.all(otherProds.map(async (otherProduct, index) => {
      const [cl, il] = await Promise.all(otherLikes[index]);
      const otherImage = otherProduct.related('image');
      const image = otherImage ? otherImage.serialize().file : config.defaultImage.product;
      const id = `${otherProduct.get('id_produk')}.${otherProduct.get('id_toko')}`;
      return {
        ...otherProduct.serialize({ minimal: true }),
        id,
        count_like: parseNum(cl),
        is_liked: !!il,
        image,
      };
    }));

    return {
      product: {
        product,
        category,
        store,
        location,
        images,
        reviews,
        rating,
        wholesaler,
        other_products: otherProds,
        expeditions,
      },
      idDropship,
    };
  }

  /**
   * Get product with its relation
   * @param productId {integer} product id
   * @param storeId {integer} store id
   * @param marketplaceId {integer} marketplace id
   */
  static async getFullOwnProduct(productId, storeId, marketplaceId) {
    let isDropship = false;
    const where = { id_produk: productId, id_toko: storeId };
    const related = {
      withRelated: [
        'category',
        'images',
        'brand',
        'catalog',
        'expeditionServices.expedition',
        { expeditionServices: qb => qb.where('status_detilekspedisiproduk', ProductExpeditionStatus.USED) },
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

    let category = product.related('category');
    const { parents, name } = await category.parents();
    category = {
      ...category.serialize(),
      full_name: name,
      parents,
    };
    const images = product.related('images');
    const expeditionServices = product.related('expeditionServices').map(service => service.serialize({ fullName: true }));
    let catalog;
    if (isDropship) {
      catalog = dropship.get('id_katalog') ? dropship.related('catalog') : null;
    } else {
      catalog = product.get('identifier_katalog') ? product.related('catalog') : null;
    }
    let brand = product.get('identifier_brand') ? product.related('brand') : null;
    if (brand && !brand.get('id_brand')) brand = null;

    product = product.serialize();
    product.commission = await MasterFee.calculateCommission(
      marketplaceId,
      product.price,
      isDropship,
    );

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
    services = services.map(service => service.serialize());

    const groups = _.groupBy(services, val => (val.expedition.name));

    return _.map(groups, (group, key) => ({
      expedition: key,
      expedition_id: group[0].expedition.id,
      services: group,
    }));
  }

  static async countProductsByCatalog(catalogIds, storeId, status = null) {
    const dropshipStatus = DropshipStatus.SHOW;
    const productStatus = status;
    return await Promise.all(catalogIds.map(async (id) => {
      const getFromProduct = this.where({
        identifier_katalog: id === 0 ? null : id,
        id_toko: storeId,
      }).query((qb) => {
        if (status) qb.where('status_produk', productStatus);
        qb.count('id_produk as count_product');
      }).fetch();
      const getFromDropshipper = Dropship.where({
        id_katalog: id === 0 ? null : id,
        id_toko: storeId,
        status_dropshipper: dropshipStatus,
      }).query(qb => qb.count('id_dropshipper as count_product')).fetch();
      const [product, dropshipper] = await Promise
        .all([getFromProduct, getFromDropshipper]);
      const countProduct = product.get('count_product') || 0;
      const countDropshipper = dropshipper.get('count_product') || 0;
      return parseNum(countProduct) + parseNum(countDropshipper);
    }));
  }

  /**
   * Hide products
   * @param storeId
   * @param ids
   */
  static async hides(storeId, ids) {
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      const where = { id_toko: storeId, id_produk: id };
      await this.where(where).save({ status_produk: ProductStatus.HIDE }, { patch: true })
        .catch(() => {});
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
      const where = { id_toko: storeId, id_produk: id };
      const product = await this.where(where).fetch().catch(() => {});
      if (!product) {
        const dropship = await Dropship.where(where).fetch().catch(() => {});
        await dropship.save({ id_katalog: catalogId }, { patch: true }).catch(() => {});
      } else {
        await product.save({ identifier_katalog: catalogId }, { patch: true }).catch(() => {});
      }
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
      const where = { id_toko: storeId, id_produk: id };
      const product = await this.where(where).fetch().catch(() => {});
      if (!product) {
        const dropship = await Dropship.where(where).fetch().catch(() => {});
        await dropship.destroy().catch(() => {
          errors.push({ product_id: id, error: errMsg.bulkDeleteProduct.error });
        });
      } else {
        await product.destroy().catch(() => {
          errors.push({ product_id: id, error: errMsg.bulkDeleteProduct.error });
        });
      }
    }
    return errors;
  }

  /**
   * Update dropship status products
   * @param storeId
   * @param ids
   */
  static async bulkUpdateDropship(storeId, ids) {
    // eslint-disable-next-line no-restricted-syntax
    for (const id of ids) {
      const product = await this.where({ id_toko: storeId, id_produk: id }).fetch().catch(() => {});
      const status = !product.toJSON().is_dropship;
      await product.save({ is_dropshiper: status }, { patch: true }).catch(() => {});
    }
  }

  /**
   * Update product
   */
  static async update(id, storeId, data) {
    const product = await this.where({ id_produk: id, id_toko: storeId }).fetch();
    if (!product) throw getProductError('product', 'not_found');
    if (_.isEmpty(data)) return product;
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
    const product = await this.where({ id_produk: id, id_toko: storeId }).fetch({
      withRelated: [
        { expeditionServices: qb => qb.where('status_detilekspedisiproduk', ProductExpeditionStatus.USED) },
      ],
    });
    if (!product) throw getProductError('product', 'not_found');
    const expeditionServices = product.related('expeditionServices');

    const store = await Store.where({ id_toko: storeId }).fetch({
      withRelated: [
        'expeditionServices.expedition.services',
        { expeditionServices: qb => qb.where('status_ekspedisitoko', StoreExpeditionStatus.USED) },
      ],
    });

    const expeditions = store.related('expeditionServices').reduce((results, service) => {
      const found = _.find(results, o => o.get('id_ekspedisi') === service.get('id_ekspedisi'));
      if (!found) results.push(service.related('expedition'));
      return results;
    }, []);

    return expeditions.map((expedition) => {
      let services = expedition.related('services').map((service) => {
        const found = _.find(expeditionServices.models, val => (
          val.get('id_ekspedisiservice') === service.get('id_ekspedisiservice')
        ));
        return {
          ...service.serialize(),
          expedition: expedition.serialize({ minimal: true }),
          is_checked: !!found,
          is_active: !!found,
        };
      });
      const totalActive = _.filter(services, { is_active: true }).length;
      expedition = expedition.serialize();
      expedition.is_active = services.length ? totalActive === services.length : false;
      services = _.sortBy(services, 'id');
      return {
        ...expedition,
        services,
      };
    });
  }

  static async getOwner(id) {
    const product = await this.where({ id_produk: id }).fetch({ withRelated: ['store.user'] });
    if (!product) throw getProductError('product', 'not_found');
    const store = product.related('store');
    return store.related('user');
  }

  /**
   * Get store products (hidden / multiple check)
   */
  static async storeProducts(params) {
    const { storeId, catalogId = null, page, pageSize, isDropship = null, hidden = null } = params;
    const where = { id_toko: storeId };
    if (hidden !== null) where.status_produk = hidden ? ProductStatus.HIDE : ProductStatus.SHOW;
    const isChecked = catalogId ? false : undefined;

    if (catalogId) where.identifier_katalog = catalogId;
    if (isDropship !== null) where.is_dropshiper = isDropship;

    const products = await this.where(where).fetchPage({ page, pageSize });

    return await Promise.all(products.map(async (product) => {
      await product.load({ images: qb => qb.limit(1) });
      const images = product.related('images').models;
      const image = images.length ? images[0].serialize().file : config.defaultImage.product;
      return {
        ...product.serialize({ minimal: true }),
        image,
        is_checked: isChecked,
      };
    }));
  }

  /**
   * Get store products (search)
   */
  static async storeProductsSearch(params) {
    const {
      page,
      pageSize,
      storeId,
      query,
      catalogId,
      hidden,
      masterFee,
    } = params;
    const status = hidden ? ProductStatus.HIDE : ProductStatus.SHOW;
    const offset = page <= 1 ? 0 : (page - 1) * pageSize;

    const products = await this.query((qb) => {
      qb.select(['*', 'tglstatus_produk as date_created', 'produk.id_toko', 'produk.identifier_katalog as identifier_katalog']);
      qb.select(knex.raw('null as "id_dropshipper"'));
      qb.where('produk.id_toko', storeId).andWhere('status_produk', status);
      if (query) qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
      if (catalogId) qb.where('identifier_katalog', catalogId);
      qb.union(function () {
        const dropship = this
          .select([
            'p.*',
            'd.tglstatus_dropshipper as date_created',
            'd.id_toko',
            'd.id_katalog as identifier_katalog',
            'id_dropshipper',
          ])
          .from('produk as p')
          .leftJoin('dropshipper as d', 'd.id_produk', 'p.id_produk')
          .where('d.id_toko', storeId);
        if (query) dropship.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        if (catalogId) qb.where('d.id_katalog', catalogId);
      });
      qb.orderBy('date_created', 'desc');
      qb.limit(pageSize).offset(offset);
    }).fetchAll({ withRelated: ['images', 'store'] });

    return await Promise.all(products.map(async (product) => {
      await product.load({ images: qb => qb.limit(1) });
      const images = product.related('images').models;
      const image = images.length ? images[0].serialize().file : config.defaultImage.product;
      const dropshipOrigin = !product.get('id_dropshipper') ? undefined
        : {
          store_id: product.get('id_produk'),
          name: product.related('store').get('nama_toko'),
          commission: {
            nominal: MasterFee.calculateCommissionByFees(masterFee, Number(product.get('harga_produk'))),
            percent: MasterFee.calculateCommissionByFees(masterFee, Number(product.get('harga_produk')), true),
          },
        };
      return {
        ...product.serialize({ minimal: true }),
        image,
        dropship_origin: dropshipOrigin,
      };
    }));
  }

  /**
   * @param productId {int}
   * @param storeId {int}
   * @param isOriginalStore {boolean}
   */
  static async findProduct(productId, storeId, isOriginalStore = false) {
    const withRelated = isOriginalStore ? 'store.user' : null;
    const getOwn = this.where({ 'produk.id_produk': productId, 'produk.id_toko': storeId }).fetch({ withRelated });
    let select = ['produk.*', 'id_dropshipper'];
    if (isOriginalStore) {
      select = [
        ...select,
        'd.id_toko as d_id_toko',
        'u.id_users as u_id_users',
        'u.reg_token',
        'u.notifications',
      ];
    }
    const getDropship = this.query((qb) => {
      qb.select(select);
      qb.leftJoin('dropshipper as d', 'd.id_produk', 'produk.id_produk');
      if (isOriginalStore) {
        qb.join('toko as t', 't.id_toko', 'd.id_toko');
        qb.join('users as u', 'u.id_users', 't.id_users');
      }
      qb.where({ 'd.id_produk': productId, 'd.id_toko': storeId });
    }).fetch();
    const [own, dropship] = await Promise.all([getOwn, getDropship]);
    return own || dropship;
  }

  static getShareLink(domain, data) {
    const storeName = slug(data.store.name, { lower: true, charmap: '' });
    return `https://${domain}/detail/${storeName}/${data.product.slug}-${data.product.id}`;
  }

  static getProductByCatalogId(catalogId, storeId) {
    return this.query((qb) => {
      qb.select(['*', 'tglstatus_produk as date_created', 'produk.id_toko', 'produk.identifier_katalog as identifier_katalog']);
      qb.select(knex.raw('null as "id_dropshipper"'));
      qb.where('status_produk', ProductStatus.SHOW);
      qb.where('identifier_katalog', catalogId);
      qb.where('produk.id_toko', storeId);
      qb.union(function () {
        this
          .select([
            'p.*',
            'd.tglstatus_dropshipper as date_created',
            'd.id_toko',
            'd.id_katalog as identifier_katalog',
            'id_dropshipper',
          ])
          .from('produk as p')
          .leftJoin('dropshipper as d', 'd.id_produk', 'p.id_produk')
          .where('d.id_katalog', catalogId)
          .where('d.id_toko', storeId);
      });
      qb.orderBy('date_created', 'desc');
      qb.limit(3);
    }).fetchAll({ withRelated: 'image' });
  }

  static getCountSold(storeId) {
    const fromProduct = this.query((qb) => {
      qb.select(knex.raw('SUM(count_sold::integer) as "count_sold"'));
      qb.where('id_toko', storeId);
    }).fetch();

    const fromDropship = Dropship.query((qb) => {
      qb.select(knex.raw('SUM(count_sold::integer) as "count_sold"'));
      qb.where('id_toko', storeId);
    }).fetch();

    return [fromProduct, fromDropship];
  }

  static getLike(product, userId, isModel = true) {
    const productId = isModel ? product.id : product.id_produk;
    const dropshipperId = isModel ? product.get('id_dropshipper') || null : product.id_dropshipper;

    const countLike = Wishlist.where({
      id_produk: productId,
      id_dropshipper: dropshipperId,
    }).count();

    const isLiked = userId ? Wishlist.where({
      id_users: userId,
      id_produk: productId,
      id_dropshipper: dropshipperId,
    }).fetch() : false;

    return [countLike, isLiked];
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
    return matchDB(data, column);
  }
}

export const Product = bookshelf.model('Product', ProductModel);
export default { Product, ProductCondition };
