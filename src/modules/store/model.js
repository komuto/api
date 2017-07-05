import moment from 'moment';
import core from '../core';
import '../user/model/user';

const { input } = core.utils;
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
   * Get store with its relation
   * @param id {integer} store id
   */
  static async getFullStore(id) {
    let origin = null;
    let district = null;
    let quality = 0;
    let accuracy = 0;
    const reviews = [];
    let store = await this.where({ id_toko: id }).fetch({
      withRelated: [
        'user.addresses.district',
        'user.addresses.province',
        'products.reviews.user',
        'products.reviews.product.images',
      ],
    });
    const user = store.related('user');
    user.related('addresses').each((val) => {
      if (val.toJSON().is_sale_address) {
        const province = val.related('province').serialize();
        district = val.related('district').serialize();
        origin = `${district.name}, ${province.name}`;
      }
    });
    let products = store.related('products');
    store = store.serialize();
    store.total_product_sold = 0;
    products.each((product) => {
      store.total_product_sold += product.toJSON().count_sold;
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
            images,
          },
        };
      });
      if (productReviews.length) reviews.push(...productReviews);
    });
    store.origin = origin;
    products = products.serialize();
    return {
      store,
      district,
      products,
      rating: {
        quality: quality / reviews.length,
        accuracy: accuracy / reviews.length,
        reviews,
      },
    };
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
    cover_image: input(
      attr.pathcoverimage_toko,
      null,
      core.imagePath(IMAGE_PATH, attr.pathcoverimage_toko),
    ),
    seller_theme_id: attr.identifier_themesseller,
    reputation: attr.reputasi_toko,
    store_id_number: attr.no_ktp_toko,
    total_favorite: attr.jumlahfavorit_toko,
    note: attr.note,
    created_at: moment(attr.tgl_create_toko).unix(),
    status_at: moment(attr.tglstatus_toko).unix(),
    verification_at: moment(attr.tanggal_verifikasi).unix(),
    is_verified: !!attr.sampai_tanggal,
    start_at: input(attr.mulai_tanggal, null, moment(attr.mulai_tanggal).unix()),
    end_at: input(attr.sampai_tanggal, null, moment(attr.sampai_tanggal).unix()),
  };
};

export const Store = bookshelf.model('Store', StoreModel);
export default { Store };
