import _ from 'lodash';
import core from '../../core';
import config from '../../../../config';
import { getStoreError, createStoreError } from './../messages';
import { OTPAddressStatus } from './../../OTP/model';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.store;

export const StoreStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

class StoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_toko';
  }

  serialize({ favorite = false, verified = false } = {}) {
    const store = {
      id: this.get('id_toko'),
      name: this.get('nama_toko'),
      logo: core.imagePath(IMAGE_PATH, this.get('logo_toko')),
    };
    if (favorite) return store;
    if (verified) store.is_verified = this.related('verifyAddress').length !== 0;
    return {
      ...store,
      user_id: this.get('id_users'),
      slogan: this.get('slogan_toko'),
      description: this.get('deskripsi_toko'),
      custom_domain: this.get('custom_domain'),
      status: parseInt(this.get('status_toko'), 10),
      remarks_status: this.get('remarks_status_toko'),
      cover_image: core.imagePath(IMAGE_PATH, this.get('pathcoverimage_toko')),
      seller_theme_id: this.get('identifier_themesseller'),
      reputation: this.get('reputasi_toko'),
      store_id_number: this.get('no_ktp_toko'),
      total_favorite: this.get('jumlahfavorit_toko'),
      term_condition: this.get('note'),
      created_at: parseDate(this.get('tgl_create_toko')),
      status_at: parseDate(this.get('tglstatus_toko')),
      verification_at: parseDate(this.get('tanggal_verifikasi')),
      start_at: parseDate(this.get('mulai_tanggal')),
      end_at: parseDate(this.get('sampai_tanggal')),
    };
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users');
  }

  /**
   * Add relation to Product
   */
  products() {
    return this.hasMany('Product', 'id_toko');
  }

  /**
   * Add relation to Catalog
   */
  catalogs() {
    return this.hasMany('Catalog', 'id_toko');
  }

  /**
   * Add relation to ExpeditionService
   */
  expeditionServices() {
    return this.belongsToMany('ExpeditionService', 'detil_ekspedisitoko', 'id_toko', 'id_ekspedisiservice')
      .withPivot(['status_ekspedisitoko']);
  }

  /**
   * Add relation to OTPAddress
   */
  verifyAddress() {
    return this.hasMany('OTPAddress', 'id_users');
  }

  favoriteStores() {
    return this.hasMany('FavoriteStore', 'referred_toko', 'id_toko');
  }

  /**
   * Get detail catalogs
   * @param store
   * @param userId
   */
  static getCatalogs(store, userId) {
    return store.related('catalogs').map((catalog) => {
      const catalogProducts = catalog.related('products').map((product) => {
        const images = product.related('images').serialize();
        const { likes, isLiked } = this.getLikes(product, userId);
        return {
          ...product.serialize({ minimal: true }),
          image: images.length ? images[0].file : config.defaultImage.product,
          count_like: likes.length,
          is_liked: isLiked,
        };
      });
      return {
        ...catalog.serialize(),
        products: catalogProducts,
      };
    });
  }

  /**
   * Get marketplace id with store id
   * @param id {integer} store id
   */
  static async getMarketplaceId(id) {
    const store = await new this({ id_toko: id }).fetch({ withRelated: ['user'] });
    if (!store) return false; // Store not found
    const user = store.related('user');
    return user.get('id_marketplaceuser');
  }

  /**
   * Get detail user
   * @param store
   * @returns {{origin: *, district: *}}
   */
  static getOriginAndDistrict(store) {
    let origin = null;
    let district = null;
    const user = store.related('user');
    user.related('addresses').each((val) => {
      if (val.toJSON().is_sale_address) {
        const province = val.related('province').serialize();
        district = val.related('district').serialize();
        origin = `${district.name}, ${province.name}`;
      }
    });
    return { origin, district };
  }

  /**
   * Get reviews
   * @param store
   * @returns {{reviews: Array, totalSold: number, quality: number, accuracy: number}}
   */
  static getReviews(store) {
    let quality = 0;
    let accuracy = 0;
    let totalSold = 0;
    const reviews = [];
    const products = store.related('products');
    products.each((product) => {
      totalSold += product.toJSON().count_sold;
      const productReviews = product.related('reviews').map((review) => {
        quality += review.toJSON().quality;
        accuracy += review.toJSON().accuracy;
        const { name, id: userId, photo } = review.related('user').serialize();
        const reviewProduct = review.related('product');
        const images = reviewProduct.related('images').serialize();
        return {
          ...review.serialize(),
          user: { id: userId, name, photo },
          product: {
            ...reviewProduct.serialize(),
            image: images.length ? images[0].file : config.defaultImage.product,
          },
        };
      });
      if (productReviews.length) reviews.push(...productReviews);
    });
    return { reviews, totalSold, quality, accuracy };
  }

  /**
   * Get likes
   * @param product
   * @param id
   * @returns {{likes: (Model|Collection|undefined|*), isLiked: *}}
   */
  static getLikes(product, id) {
    const likes = product.related('likes');
    const isLiked = id ? _.find(likes.models, o => o.attributes.id_users === id) : false;
    return { likes, isLiked };
  }

  /**
   * Get store with its relation
   * @param id {integer} store id
   * @param userId {integer} user id
   */
  static async getFullStore(id, userId) {
    let store = await this.where({ id_toko: id }).fetch({
      withRelated: [
        // TODO: add is_favorite
        'user.addresses.district',
        'user.addresses.province',
        'products.reviews.user',
        'catalogs.products.likes',
        { 'products.reviews.product.images': qb => qb.limit(1) },
        { 'catalogs.products': qb => qb.limit(3) },
        { 'catalogs.products.images': qb => qb.limit(1) },
        { verifyAddress: qb => qb.where('status_otpaddress', OTPAddressStatus.VERIFIED) },
      ],
    });
    if (!store) throw getStoreError('store', 'not_found');
    const catalogs = this.getCatalogs(store, userId);
    const { origin, district } = this.getOriginAndDistrict(store);
    const { reviews, totalSold, quality, accuracy } = this.getReviews(store);
    store = store.serialize({ verified: true });
    store.total_product_sold = totalSold;
    store.origin = origin;
    return {
      ...store,
      district,
      catalogs,
      rating: {
        quality: quality / reviews.length,
        accuracy: accuracy / reviews.length,
        reviews,
      },
    };
  }

  /**
   * Get list expedition service
   * @param userId {integer} user id
   * @param isManaged {boolean} manage status
   */
  static async getUserExpeditions(userId, isManaged = false) {
    const expeditions = [];
    const store = await this.where({ id_users: userId }).fetch({
      withRelated: [
        {
          expeditionServices: (qb) => {
            if (!isManaged) qb.where('status_ekspedisitoko', '0');
          },
        },
        'expeditionServices.expedition',
      ],
    });
    const expeditionServices = store.related('expeditionServices');
    expeditionServices.each((service) => {
      const expedition = service.related('expedition').serialize();
      const found = _.find(expeditions, { id: expedition.id });
      if (isManaged) {
        const isActive = service.pivot.toJSON().status_ekspedisitoko;
        service = service.serialize();
        service.is_active = isActive === '0';
      }
      if (found === undefined) {
        expedition.services = [service];
        return expeditions.push(expedition);
      }
      return found.services.push(service);
    });
    return expeditions;
  }

  /**
   * Create store
   * @param data {object} store data
   */
  static async create(data) {
    const store = await this.where({ id_users: data.id_users }).fetch();
    if (store) throw createStoreError('store', 'duplicate');
    return await new this(data).save();
  }

  /**
   * Update store
   */
  static async update(data, userId) {
    const store = await this.where({ id_users: userId }).fetch();
    if (!store) throw getStoreError('store', 'not_found');
    return await store.save(data, { patch: true });
  }

  /**
   * Create store expeditions
   * @param store {object} store data
   * @param services {object} expedition services data
   */
  static async createExpeditionServices(store, services) {
    return services.forEach(async (service) => {
      await store.expeditionServices().attach(service).catch(() => {});
    });
  }

  /**
   * Get store id
   * @param id {integer} user id
   */
  static async getStoreId(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw getStoreError('store', 'not_found');
    return store.get('id_toko');
  }

  static async updateVerification(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw getStoreError('store', 'not_found');
    return await store.save({ tanggal_verifikasi: new Date() }, { patch: true });
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      name: 'nama_toko',
      slogan: 'slogan_toko',
      description: 'deskripsi_toko',
      logo: 'logo_toko',
      created_at: 'tgl_create_toko',
      status: 'status_toko',
      status_at: 'tglstatus_toko',
      seller_theme_id: 'identifier_themesseller',
      store_id_number: 'no_ktp_toko',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Store = bookshelf.model('Store', StoreModel);
export default { Store, StoreStatus };
