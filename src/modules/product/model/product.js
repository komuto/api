import _ from 'lodash';
import moment from 'moment';
import core from '../../core';
import { model } from '../../address';
import '../../store/model';
import './imageProduct';
import '../../category/model';
import '../../review/model';

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
    const { page, pageSize, query, price, condition, address } = params;
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
    // eslint-disable-next-line no-restricted-syntax
    for (let product of products.models) {
      const store = product.related('store');
      const images = product.related('images');
      const likes = product.related('likes');
      product = product.toJSON();
      product.count_like = likes.length;
      if (address) {
        const addressStore = await Address.getStoreAddress(store.toJSON().user_id, address);
        if (addressStore) {
          results.push({ product, store, images });
        }
      } else {
        results.push({ product, store, images });
      }
    }

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

ProductModel.prototype.serialize = function () {
  const products = {
    id: this.attributes.id_produk,
    category_id: this.attributes.id_kategoriproduk,
    store_id: this.attributes.id_toko,
    name: this.attributes.nama_produk,
    stock: this.attributes.stock_produk,
    weight: this.attributes.berat_produk,
    type: this.attributes.jenis_produk ? parseInt(this.attributes.jenis_produk, 10) : undefined,
    description: this.attributes.deskripsi_produk,
    price: this.attributes.harga_produk ? parseFloat(this.attributes.harga_produk) : undefined,
    // eslint-disable-next-line max-len
    attrval: this.attributes.attrval_produk ? parseInt(this.attributes.attrval_produk, 10) : undefined,
    status: this.attributes.status_produk ? parseInt(this.attributes.status_produk, 10) : undefined,
    // eslint-disable-next-line max-len
    insurance: this.attributes.asuransi_produk ? parseInt(this.attributes.asuransi_produk, 10) : undefined,
    discount: this.attributes.disc_produk,
    margin_dropshipper: this.attributes.margin_dropshiper,
    is_dropshipper: this.attributes.is_dropshiper,
    is_wholesaler: this.attributes.is_grosir,
    is_discount: !!this.attributes.disc_produk,
    count_sold: this.attributes.count_sold ? this.attributes.count_sold : 0,
    count_popular: this.attributes.count_populer ? this.attributes.count_populer : 0,
    identifier_brand: this.attributes.identifier_brand,
    identifier_catalog: this.attributes.identifier_katalog,
    // eslint-disable-next-line max-len
    status_at: this.attributes.tglstatus_produk ? moment(this.attributes.tglstatus_produk).unix() : undefined,
    // eslint-disable-next-line max-len
    created_at: this.attributes.date_created_produk ? moment(this.attributes.date_created_produk).unix() : undefined,
  };

  return products;
};

export const Product = bookshelf.model('Product', ProductModel);
export default { Product, ProductType };
