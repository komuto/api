import moment from 'moment';
import core from '../core';
import { createReviewError } from './messages';
import config from '../../../config';
import { Invoice } from '../payment/model';
import { Product } from '../product/model/product';
import { Dropship } from '../product/model/dropship';
import { getNotification, NotificationType } from '../user/model/user';

const { Notification, sellerNotification } = core;
const bookshelf = core.postgres.db;
const { parseNum, parseDate, parseDec, getProductAndStore, matchDB } = core.utils;

class ReviewModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'ulasan_produk';
  }
  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ulasanproduk';
  }

  serialize({ minimal = true } = {}) {
    const review = {
      id: this.get('id_ulasanproduk'),
      review: this.get('isi_ulasanproduk'),
      quality: parseNum(this.get('kualitasproduk')),
      accuracy: parseNum(this.get('akurasiproduk')),
      created_at: parseDate(this.get('tgl_ulasanproduk')),
    };
    if (!minimal) {
      return {
        ...review,
        product_id: this.get('id_produk'),
        dropshipper_id: this.get('id_dropshipper'),
      };
    }
    return review;
  }

  user() {
    return this.belongsTo('User', 'id_users');
  }

  product() {
    return this.belongsTo('Product', 'id_produk');
  }

  /**
   * Get a line item by condition
   * @param data {Object}
   * @param {integer} pageSize limit
   * @param {integer} page
   * @param {boolean} withProduct
   */
  static async getAll(data, { pageSize, page }, withProduct = false) {
    const withRelated = ['user'];
    if (withProduct) withRelated.push('product.store');
    const reviews = await this.query((qb) => {
      if (data.store_id) {
        qb.innerJoin('produk', 'produk.id_produk', 'ulasan_produk.id_produk');
        qb.where('ulasan_produk.id_toko', data.store_id);
      }
      if (data.q) qb.whereRaw('LOWER(isi_ulasanproduk) LIKE ?', `%${data.q.toLowerCase()}%`);
      if (data.product_id) qb.where('ulasan_produk.id_produk', data.product_id);
      if (data.user_id) qb.where('ulasan_produk.id_users', data.user_id);
    }).orderBy('-id_ulasanproduk')
      .fetchPage({ pageSize, page, withRelated });
    const { pageSize: limit, rowCount: total, pageCount: pages } = reviews.pagination;
    const models = await Promise.all(reviews.models.map(async (review) => {
      const { id, name, photo } = review.related('user').serialize();
      if (withProduct) {
        const product = review.related('product');
        const { id: pId, name: pName } = product.serialize();
        const store = product.related('store').serialize({ favorite: true });
        await product.load({ images: qb => qb.limit(1) });
        let image = product.related('images').models[0];
        image = image ? image.serialize() : config.defaultImage.product;
        return {
          ...review.serialize(),
          product: { id: parseDec(`${pId}.${store.id}`), name: pName, image: image.file, store },
          user: { id, name, photo },
        };
      }
      return {
        ...review.serialize({ minimal: false }),
        user: { id, name, photo },
      };
    }));
    return {
      pagination: { page: reviews.pagination.page, limit, total, pages },
      models,
    };
  }

  /**
   * Bulk create review
   * @param {Object} params
   */
  static async bulkCreate(params) {
    const { user_id: userId, bucket_id: bucketId, invoice_id: invoiceId, reviews } = params;

    const invoice = await Invoice.get(userId, bucketId, invoiceId);
    const items = invoice.related('items');

    return await Promise.all(reviews.map(async (val) => {
      const { productId, storeId: sId } = getProductAndStore(val.product_id);
      const product = await Product.findProduct(productId, sId);
      if (!product) throw createReviewError('product', 'store_not_found');
      const item = items.find(o => o.get('id_produk') === product.get('id_produk')
        && o.get('id_dropshipper') === product.get('id_dropshipper'));
      if (!item) throw createReviewError('product', 'product_not_found');

      return await this.create(item, product.serialize(), userId, val);
    }));
  }

  static async create(item, product, userId, val) {
    let storeId = product.store_id;
    const data = this.matchDBColumn({
      ...val,
      product_id: product.id,
      store_id: storeId,
      user_id: userId,
      dropshipper_id: item.serialize().dropshipper_id,
      created_at: moment(),
    });

    const review = await new this(data).save().catch(() => {
      throw createReviewError('review', 'error');
    });

    item.save({ id_ulasanproduk: review.serialize().id }, { patch: true });

    // Send notification to product owner
    let owner;
    if (item.serialize().dropshipper_id) {
      const dropship = await Dropship.findById(item.serialize().dropshipper_id);
      const store = dropship.related('store');
      storeId = store.get('id_toko');
      owner = store.related('user');
    } else {
      owner = await Product.getOwner(item.serialize().product_id);
    }
    const notifications = owner.serialize({ notification: true }).notifications;
    if (owner.get('reg_token') && getNotification(notifications, NotificationType.REVIEW)) {
      Notification.send(sellerNotification.REVIEW, {
        token: owner.get('reg_token'),
        product_id: parseDec(`${item.serialize().product_id}.${storeId}`),
      });
    }

    return review;
  }

  /**
   * Transform supplied data properties to match with db column
   * @param {object} data
   * @return {object} newData
   */
  static matchDBColumn(data) {
    const column = {
      user_id: 'id_users',
      product_id: 'id_produk',
      dropshipper_id: 'id_dropshipper',
      created_at: 'tgl_ulasanproduk',
      review: 'isi_ulasanproduk',
      quality: 'kualitasproduk',
      accuracy: 'akurasiproduk',
      store_id: 'id_toko',
    };
    return matchDB(data, column);
  }
}

export const Review = bookshelf.model('Review', ReviewModel);
export default { Review };
