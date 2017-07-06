import _ from 'lodash';
import core from '../../core';
import { model } from '../../address';

const { parseNum, parseDec, parseDate } = core.utils;
const { Address } = model;
const bookshelf = core.postgres.db;

export const ProductType = {
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

  /**
   * Get products
   */
  static async get(params) {
    const { page, pageSize, query, price, condition, address, userId } = params;
    let { where, sort, other, brands, services } = params;
    let relatedServices = null;

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

    where = _.omitBy(where, _.isNil);
    if (condition) {
      _.assign(where, { jenis_produk: condition === 'new' ? ProductType.NEW : ProductType.USED });
    }
    if (other) {
      const otherArr = other.split(',');
      other = {};
      _.map(otherArr, (val) => {
        if (val === 'wholesaler') {
          _.assign(where, { is_grosir: true });
        }
        other[val] = true;
      });
    }
    if (services) {
      services = services.split(',');
      relatedServices = {
        expeditionServices: (qb) => {
          qb.whereIn('detil_ekspedisiproduk.id_ekspedisiservice', services);
        },
      };
    }
    const products = await this.where(where)
      .query((qb) => {
        if (query) {
          qb.whereRaw('LOWER(nama_produk) LIKE ?', `%${query.toLowerCase()}%`);
        }
        if (price) {
          qb.whereBetween('harga_produk', [price.min, price.max]);
        }
        if (other && other.discount) {
          qb.where('disc_produk', '>', 0);
        }
        if (brands) {
          brands = brands.split(',');
          qb.whereIn('identifier_brand', brands);
        }
      })
      .orderBy(sort)
      .orderBy('id_produk')
      .fetchPage({
        page,
        pageSize,
        withRelated: [
          'images',
          {
            store: (qb) => {
              if (other && other.verified) {
                qb.whereRaw('mulai_tanggal IS NOT NULL');
              }
            },
          },
          relatedServices,
          'likes',
        ],
      });

    const results = [];
    products.each(async (product) => {
      const store = product.related('store');
      const images = product.related('images');
      const likes = product.related('likes');
      const isLiked = userId ? _.find(likes.models, o => o.attributes.id_users === userId) : false;
      product = product.toJSON();
      product.count_like = likes.length;
      product.is_liked = !!isLiked;
      if (address) {
        const addressStore = await Address.getStoreAddress(store.toJSON().user_id, address);
        if (addressStore) {
          results.push({ product, store, images });
        }
      } else {
        results.push({ product, store, images });
      }
    });

    return results;
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

  /**
   * Get product with its relation
   * @param id {integer} product id
   */
  static async getFullProduct(id) {
    let product = await this.where({ id_produk: id }).fetch({
      withRelated: ['category', 'store', 'images', 'reviews.user.addresses'],
    });
    const category = product.related('category').serialize();
    const store = product.related('store').serialize();
    const getAddress = Address.getStoreAddress(store.user_id);
    const images = product.related('images');
    const reviews = product.related('reviews').map((review) => {
      const { name, id: userId, photo } = review.related('user').serialize();
      return {
        ...review.serialize(),
        user: { id: userId, name, photo },
      };
    });
    const address = await getAddress;
    store.province = address.related('province').serialize();
    product = product.serialize();
    product.count_review = reviews.length;
    return {
      product,
      category,
      store,
      images,
      reviews,
    };
  }
}

ProductModel.prototype.serialize = function (full = true) {
  const attr = this.attributes;
  if (!full) {
    return {
      id: attr.id_produk,
      name: attr.nama_produk,
      price: parseDec(attr.harga_produk),
      discount: attr.disc_produk,
      is_discount: !!attr.disc_produk,
    };
  }
  return {
    id: attr.id_produk,
    category_id: attr.id_kategoriproduk,
    store_id: attr.id_toko,
    name: attr.nama_produk,
    stock: attr.stock_produk,
    weight: attr.berat_produk,
    type: parseNum(attr.jenis_produk, 0),
    description: attr.deskripsi_produk,
    price: parseDec(attr.harga_produk),
    attrval: parseNum(attr.attrval_produk, 0),
    status: parseNum(attr.status_produk, 0),
    insurance: parseNum(attr.asuransi_produk, 0),
    discount: attr.disc_produk,
    margin_dropshipper: attr.margin_dropshiper,
    is_dropshipper: attr.is_dropshiper,
    is_wholesaler: attr.is_grosir,
    is_discount: !!attr.disc_produk,
    count_sold: parseNum(attr.count_sold, 0),
    count_popular: parseNum(attr.count_populer, 0),
    identifier_brand: attr.identifier_brand,
    identifier_catalog: attr.identifier_katalog,
    status_at: parseDate(attr.tglstatus_produk),
    created_at: parseDate(attr.date_created_produk),
  };
};

export const Product = bookshelf.model('Product', ProductModel);
export default { Product, ProductType };
