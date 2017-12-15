import moment from 'moment';
import core from '../core';
import { createReviewError } from './messages';
import config from '../../../config';
import { Invoice } from '../payment/model';
import { Product } from '../product/model/product';
import { Dropship } from '../product/model/dropship';
import { getNotification, NotificationType, User } from '../user/model/user';
import { ShippingReceiverStatus, ShippingSenderStatus } from '../bucket/model';
import { MasterFee } from '../product/model/master_fee';
import { TransType } from '../saldo/model/transaction_type';
import { SummTransType, TransSummary } from '../saldo/model/transaction_summary';
import { InvoiceTransactionStatus } from '../payment/model/invoice';

const knex = core.postgres.knex;
const { Notification, sellerNotification } = core;
const bookshelf = core.postgres.db;
const { parseNum, parseDate, getProductAndStore, matchDB } = core.utils;

class ReviewModel extends bookshelf.Model {
  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return 'ulasan_produk';
  }

  // eslint-disable-next-line class-methods-use-this
  get idAttribute() {
    return 'id_ulasanproduk';
  }

  // eslint-disable-next-line class-methods-use-this
  get hasTimestamps() {
    return false;
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
   * @param {string} domain
   * @param {boolean} withProduct
   */
  static async getAll(data, { pageSize, page }, domain, withProduct = false) {
    const withRelated = !withProduct ? 'user' : ['user', 'product.store', 'product.image'];
    const reviews = await this
      .query((qb) => {
        if (data.store_id) qb.where('ulasan_produk.id_toko', data.store_id);
        if (data.q) qb.whereRaw('LOWER(isi_ulasanproduk) LIKE ?', `%${data.q.toLowerCase()}%`);
        if (data.product_id) qb.where('ulasan_produk.id_produk', data.product_id);
        if (data.user_id) qb.where('ulasan_produk.id_users', data.user_id);
      })
      .orderBy('-tgl_ulasanproduk')
      .fetchPage({ pageSize, page, withRelated });

    return reviews.models.map((review) => {
      const { id, name, photo } = review.related('user').serialize({}, domain);
      if (withProduct) {
        const product = review.related('product');
        const { id: pId, name: pName } = product.serialize();
        const store = product.related('store').serialize({ favorite: true }, domain);
        let image = product.related('image');
        image = image ? image.serialize(domain).file : config.defaultImage.product;
        return {
          ...review.serialize(),
          product: { id: `${pId}.${store.id}`, name: pName, image, store },
          user: { id, name, photo },
        };
      }
      return {
        ...review.serialize({ minimal: false }),
        user: { id, name, photo },
      };
    });
  }

  static getRating(productId, storeId, marketplaceId = null) {
    const select = [
      'count("id_ulasanproduk") as "count_review"',
      'SUM(kualitasproduk::integer) as "qualities"',
      'SUM(akurasiproduk::integer) as "accuracies"',
    ];
    return this
      .query((qb) => {
        qb.select(knex.raw(select.join(',')));
        qb.where('ulasan_produk.id_produk', productId);
        qb.where('p.id_toko', storeId); // from original store
        qb.where('ulasan_produk.id_toko', storeId); // from dropship product
        if (marketplaceId) {
          qb.where('u.id_marketplaceuser', marketplaceId);
          qb.join('users as u', 'u.id_users', 'ulasan_produk.id_users');
        }
        qb.join('produk as p', 'p.id_produk', 'ulasan_produk.id_produk');
      })
      .fetch();
  }

  /**
   * Bulk create review
   * @param {Object} params
   * @param {Object} marketplace
   */
  static async bulkCreate(params, marketplace) {
    const { user_id: userId, bucket_id: bucketId, invoice_id: invoiceId, reviews } = params;

    let invoice = Invoice.get(userId, bucketId, invoiceId, ['items', 'shipping', 'store.user']);
    let masterFee = MasterFee.findByMarketplaceId(marketplace.id);
    let remark = TransType.getRemark(SummTransType.SELLING);
    [invoice, masterFee] = await Promise.all([invoice, masterFee]);

    const items = invoice.related('items');
    let shipping = invoice.related('shipping');
    shipping = shipping.serialize();
    let amount = 0;

    const reviewData = await Promise.all(reviews.map(async (val) => {
      const { productId, storeId: sId } = getProductAndStore(val.product_id);
      let product = await Product.findProduct(productId, sId);
      if (!product) throw createReviewError('product', 'store_not_found');
      const item = items.find(o => o.get('id_produk') === product.get('id_produk'));
      if (!item) throw createReviewError('product', 'product_not_found');

      const itemObj = item.serialize();
      product = product.serialize();

      const commission = MasterFee.calculateCommissionByFees(masterFee, Number(product.price));
      amount += ((product.price - commission) * itemObj.qty)
        + itemObj.additional_cost
        + shipping.insurance_fee;

      return await this.create(item, product, userId, val, marketplace);
    }));

    amount += shipping.delivery_cost;

    const seller = invoice.related('store').related('user');
    const { saldo_wallet: saldo } = seller.serialize();
    const remainingSaldo = saldo + amount;

    remark = await remark;
    TransSummary.create(TransSummary.matchDBColumn({
      amount,
      first_saldo: saldo,
      last_saldo: remainingSaldo,
      user_id: seller.id,
      type: SummTransType.SELLING,
      remark,
      marketplace_id: marketplace.id,
      summaryable_type: 'invoice',
      summaryable_id: invoice.id,
    }));

    User.where({ id_users: seller.id }).save({ saldo_wallet: remainingSaldo }, { patch: true });

    invoice.related('shipping').save({
      statusresponkirim: ShippingSenderStatus.SENT,
      statusresponterima: ShippingReceiverStatus.ACCEPT,
    }, { patch: true });

    Invoice.updateStatus(invoice.id, InvoiceTransactionStatus.RECEIVED);

    if (seller.get('reg_token')) {
      Notification.send(
        sellerNotification.ORDER_RECEIVED,
        seller.get('reg_token'),
        marketplace,
        { invoice_id: String(invoice.id), click_action: `order-detail?id=${invoice.id}` },
      );
    }

    return reviewData;
  }

  static async create(item, product, userId, val, marketplace) {
    let storeId = product.store_id;
    const data = this.matchDBColumn({
      ...val,
      product_id: product.id,
      store_id: storeId,
      user_id: userId,
      dropshipper_id: item.serialize().dropshipper_id,
      created_at: moment().toDate(),
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
      owner = await Product.getOwner(product.id);
    }
    const notifications = owner.serialize({ notification: true }).notifications;
    if (owner.get('reg_token') && getNotification(notifications, NotificationType.REVIEW)) {
      const productId = `${item.serialize().product_id}.${storeId}`;
      Notification.send(
        sellerNotification.REVIEW,
        owner.get('reg_token'),
        marketplace,
        { product_id: productId, click_action: `reviews?id=${productId}` },
      );
    }

    return review;
  }

  static async getByStoreId(storeId, page, pageSize, domain) {
    const select = [
      'count("id_ulasanproduk") as "count_review"',
      'SUM(kualitasproduk::integer) as "qualities"',
      'SUM(akurasiproduk::integer) as "accuracies"',
    ];
    let rating = this
      .query((qb) => {
        qb.select(knex.raw(select.join(',')));
        qb.where('id_toko', storeId);
      })
      .fetch();

    let reviews = this
      .query((qb) => {
        qb.where('id_toko', storeId);
        qb.orderBy('tgl_ulasanproduk', 'desc');
      })
      .fetchPage({ page, pageSize, withRelated: ['user', 'product.image'] });

    [rating, reviews] = await Promise.all([rating, reviews]);

    reviews = reviews.map((review) => {
      const { name, id: userId, photo } = review.related('user').serialize({}, domain);
      let product = review.related('product');
      const image = product.related('image');
      product = product.serialize();
      product.id = `${product.id}.${review.get('id_toko')}`;
      product.image = image ? image.serialize(domain).file : config.defaultImage.product;
      return {
        ...review.serialize(),
        user: { id: userId, name, photo },
        ...product,
      };
    });

    const qualities = parseNum(rating.get('qualities'));
    const accuracies = parseNum(rating.get('accuracies'));
    const countReview = parseNum(rating.get('count_review'));

    return {
      rating: {
        quality: countReview ? qualities / countReview : 0,
        accuracy: countReview ? accuracies / countReview : 0,
      },
      reviews,
    };
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
