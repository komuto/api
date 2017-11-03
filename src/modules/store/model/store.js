import _ from 'lodash';
import moment from 'moment';
import core from '../../core';
import config from '../../../../config';
import { getStoreError, createStoreError } from './../messages';
import { StoreExpeditionStatus } from './store_expedition';
import { Expedition } from '../../expedition/model';
import { Product } from '../../product/model/product';

const { parseDate, parseNum } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.store;

export const StoreStatus = {
  INACTIVE: 0,
  ACTIVE: 1,
};

export const StoreVerificationStatus = {
  DEFAULT: 1, // unverified but still can create product
  UNVERIFIED: 2,
  VERIFIED: 3,
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

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
  }

  serialize({ favorite = false, verified = false, message = false } = {}) {
    const store = {
      id: this.get('id_toko'),
      name: this.get('nama_toko'),
      logo: core.imagePath(IMAGE_PATH, this.get('logo_toko')),
    };
    if (message) {
      store.user_id = this.get('id_users');
      return store;
    }
    if (favorite) return store;
    if (verified) {
      store.is_verified = this.get('verification_status') === StoreVerificationStatus.VERIFIED;
      store.verification_status = this.get('verification_status');
    }
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
    return this.hasMany('OTPAddress', 'id_users').through('User', 'id_users', 'id_users', 'id_users', 'id_users');
  }

  favoriteStores() {
    return this.hasMany('FavoriteStore', 'referred_toko', 'id_toko');
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
   * Get likes
   * @param product
   * @param userId
   * @returns {{is_liked: bool, count_like: integer}}
   */
  static getLikes(product, userId) {
    const likes = product.related('likes');
    const id = parseNum(product.get('id_dropshipper'), null);
    const isLiked = likes.some(like => parseNum(like.get('id_users')) === userId
      && parseNum(like.get('id_dropshipper'), null) === id);
    const countLike = likes.length;
    return { is_liked: isLiked, count_like: countLike };
  }

  /**
   * Get store with its relation
   * @param id {integer} store id
   * @param userId {integer} user id
   * @param marketplaceId {integer} marketplace id
   */
  static async getFullStore(id, userId, marketplaceId) {
    const related = [
      'user.addresses.district',
      'user.addresses.province',
      'catalogs',
    ];
    if (userId) related.push({ favoriteStores: qb => qb.where('id_users', userId) });
    let store = await this
      .query((qb) => {
        qb.where('toko.id_toko', id);
        qb.where('u.id_marketplaceuser', marketplaceId);
        qb.join('users as u', 'u.id_users', 'toko.id_users');
      })
      .fetch({ withRelated: related });

    if (!store) throw getStoreError('store', 'not_found');
    let catalogs = store.related('catalogs');
    catalogs.models.push({ id: null });

    catalogs = Promise.all(catalogs.map(async (catalog) => {
      let catalogProducts = await Product.getProductByCatalogId(catalog.id, store.id);
      catalogProducts = catalogProducts.map((product) => {
        const image = product.related('image');
        const { is_liked, count_like } = this.getLikes(product, userId);
        product = product.serialize({ minimal: true });
        product.id = `${product.id}.${store.get('id_toko')}`;

        return {
          ...product,
          image: image ? image.serialize().file : config.defaultImage.product,
          count_like,
          is_liked,
        };
      });
      catalog = catalog.id ? catalog.serialize() : { id: 0, store_id: id, name: 'Tanpa Katalog' };
      return {
        ...catalog,
        products: catalogProducts,
      };
    }));

    const [data, fromProduct, fromDropship] = await Promise.all([
      catalogs,
      ...Product.getCountSold(store.id),
    ]);
    catalogs = data;
    const totalSold = parseNum(fromProduct.get('count_sold')) + parseNum(fromDropship.get('count_sold'));
    const { origin, district } = this.getOriginAndDistrict(store);
    const isFavorite = store.related('favoriteStores').length;
    store = store.serialize({ verified: true });
    store.total_product_sold = totalSold;
    store.origin = origin;
    store.is_favorite = !!isFavorite;
    return {
      ...store,
      district,
      catalogs,
      rating: {
        quality: 0,
        accuracy: 0,
        reviews: [],
      },
    };
  }

  /**
   * Get list expedition service
   * @param userId {integer} user id
   */
  static async getUserExpeditions(userId) {
    const expeditions = [];
    const store = await this.where({ id_users: userId }).fetch({
      withRelated: [
        { expeditionServices: qb => qb.where('status_ekspedisitoko', StoreExpeditionStatus.USED) },
        'expeditionServices.expedition',
      ],
    });
    const expeditionServices = store.related('expeditionServices');
    expeditionServices.each((service) => {
      const expedition = service.related('expedition').serialize();
      const found = _.find(expeditions, { id: expedition.id });
      if (found === undefined) {
        expedition.services = [service];
        return expeditions.push(expedition);
      }
      return found.services.push(service);
    });
    return expeditions;
  }

  /**
   * Get list expedition service manage
   * @param userId {integer} user id
   */
  static async getUserExpeditionsManage(userId) {
    const store = await this.where({ id_users: userId }).fetch({
      withRelated: [
        { expeditionServices: qb => qb.where('status_ekspedisitoko', StoreExpeditionStatus.USED) },
      ],
    });
    const expeditionServices = store.related('expeditionServices');
    const expeditions = await Expedition.fetchAll({ withRelated: ['services'] });
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

  /**
   * Find store by id
   * @param id {integer} store id
   */
  static async findById(id) {
    const store = await new this({ id_toko: id }).fetch({ withRelated: 'user' }).catch(() => {
      throw getStoreError('store', 'not_found');
    });
    if (!store) throw getStoreError('store', 'not_found');
    return store;
  }

  /**
   * Get store by user id
   */
  static async getStoreByUserId(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw getStoreError('store', 'not_found');
    return store;
  }

  static async updateVerification(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw getStoreError('store', 'not_found');
    return await store.save({
      tanggal_verifikasi: moment().toDate(),
      verification_status: StoreVerificationStatus.VERIFIED,
    }, { patch: true });
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
      term_condition: 'note',
    };
    const newData = {};
    Object.keys(data).forEach((prop) => {
      if (column[prop]) newData[column[prop]] = data[prop];
    });
    return newData;
  }
}

export const Store = bookshelf.model('Store', StoreModel);
export default { Store, StoreStatus, StoreVerificationStatus };
