import _ from 'lodash';
import core from '../../core';
import { BadRequestError } from '../../../../common/errors';
import config from '../../../../config';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = config.imageFolder.store;

class StoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_toko';
  }

  serialize({ favorite = false } = {}) {
    const store = {
      id: this.get('id_toko'),
      name: this.get('nama_toko'),
      logo: core.imagePath(IMAGE_PATH, this.get('logo_toko')),
    };
    if (favorite) return store;
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
      is_verified: !!this.get('sampai_tanggal'),
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
   * Get detail catalogs
   */
  static getCatalogs(store) {
    return store.related('catalogs').map((catalog) => {
      const catalogProducts = catalog.related('products').map((product) => {
        const images = product.related('images').serialize();
        return {
          ...product.serialize({ minimal: true }),
          image: images.length ? images[0].file : null,
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
    const user = store.related('user');
    return user.get('id_marketplaceuser');
  }

  /**
   * Get detail user
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
            image: images.length ? images[0].file : null,
          },
        };
      });
      if (productReviews.length) reviews.push(...productReviews);
    });
    return { reviews, totalSold, quality, accuracy };
  }

  /**
   * Get store with its relation
   * @param id {integer} store id
   */
  static async getFullStore(id) {
    let store = await this.where({ id_toko: id }).fetch({
      withRelated: [
        'user.addresses.district',
        'user.addresses.province',
        'products.reviews.user',
        {
          'products.reviews.product.images': (qb) => {
            qb.limit(1);
          },
        },
        {
          'catalogs.products': (qb) => {
            qb.limit(3);
          },
        },
        {
          'catalogs.products.images': (qb) => {
            qb.limit(1);
          },
        },
      ],
    });
    const catalogs = this.getCatalogs(store);
    const { origin, district } = this.getOriginAndDistrict(store);
    const { reviews, totalSold, quality, accuracy } = this.getReviews(store);
    store = store.serialize();
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
    if (store) throw new BadRequestError('Toko sudah ada');
    return await new this(data).save();
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

  static async getStoreId(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw new BadRequestError('Tidak ada toko');
    return store.get('id_toko');
  }

  static async updateVerification(id) {
    const store = await new this({ id_users: id }).fetch();
    if (!store) throw new BadRequestError('Tidak ada toko');
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
export default { Store };
