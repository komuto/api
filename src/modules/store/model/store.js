import _ from 'lodash';
import core from '../../core';
import './catalog';
import '../../user/model/user';

const { parseDate } = core.utils;
const bookshelf = core.postgres.db;
const IMAGE_PATH = 'toko';

class StoreModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'toko';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_toko';
  }

  /**
   * Add relation to User
   */
  user() {
    return this.belongsTo('User', 'id_users', 'id_users');
  }

  /**
   * Add relation to Product
   */
  products() {
    return this.hasMany('Product', 'id_toko', 'id_toko');
  }

  /**
   * Add relation to Catalog
   */
  catalogs() {
    return this.hasMany('Catalog', 'id_toko', 'id_toko');
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
          ...product.serialize(false),
          image: images.length ? images[0] : {},
        };
      });
      return {
        ...catalog.serialize(),
        products: catalogProducts,
      };
    });
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
            ...reviewProduct.serialize(false),
            image: images.length ? images[0] : {},
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
      store,
      catalogs,
      district,
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
}

StoreModel.prototype.serialize = function () {
  const attr = this.attributes;
  return {
    id: attr.id_toko,
    user_id: attr.id_users,
    name: attr.nama_toko,
    slogan: attr.slogan_toko,
    description: attr.deskripsi_toko,
    logo: core.imagePath(IMAGE_PATH, attr.logo_toko),
    custom_domain: attr.custom_domain,
    status: parseInt(attr.status_toko, 10),
    remarks_status: attr.remarks_status_toko,
    cover_image: core.imagePath(IMAGE_PATH, attr.pathcoverimage_toko),
    seller_theme_id: attr.identifier_themesseller,
    reputation: attr.reputasi_toko,
    store_id_number: attr.no_ktp_toko,
    total_favorite: attr.jumlahfavorit_toko,
    note: attr.note,
    created_at: parseDate(attr.tgl_create_toko),
    status_at: parseDate(attr.tglstatus_toko),
    verification_at: parseDate(attr.tanggal_verifikasi),
    is_verified: !!attr.sampai_tanggal,
    start_at: parseDate(attr.mulai_tanggal),
    end_at: parseDate(attr.sampai_tanggal),
  };
};

export const Store = bookshelf.model('Store', StoreModel);
export default { Store };
