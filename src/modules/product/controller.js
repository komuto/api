import moment from 'moment';
import requestIp from 'request-ip';
import {
  Discussion,
  Comment,
  Report,
  Wholesale,
  ImageProduct,
  ProductExpedition,
  Dropship,
  DropshipStatus,
  View,
  MasterFee,
} from './model';
import { Product, ProductCondition } from './model/product';
import { Wishlist, getNotification, NotificationType } from '../user/model';
import { Store, Catalog, StoreVerificationStatus } from '../store/model';
import {
  getProductError,
  createProductError,
  getCatalogProductsError,
  addDropshipProductError,
  msg,
  createDiscussionError,
  getDropshipProductError,
  deleteDropshipProductError,
  getDiscussionError,
} from './messages';
import { ReportEmail } from './email';
import config from './../../../config';
import { BadRequestError } from './../../../common/errors';
import core from '../core';
import dropshipFaq from '../../../config/faq';
import { notificationDefault } from '../user/model/user';
import { getStoreError } from '../store/messages';
import { Preference } from '../preference/model';

const { Notification, sellerNotification, buyerNotification } = core;
const { getProductAndStore } = core.utils;

export const ProductController = {};
export default { ProductController };

const getPrice = (price) => {
  price = price.split('-');
  return {
    min: parseInt(price[0], 10),
    max: parseInt(price[1], 10),
  };
};

/**
 * Get products
 */
ProductController.index = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const { category_id, condition: cond, catalog_id: catalogId, store_id: storeId } = req.query;
  const { is_dropship: isDropship = false } = req.body;
  const condition = cond && (cond === 'new' ? ProductCondition.NEW : ProductCondition.USED);
  const where = Product.matchDBColumn({ condition, category_id });
  const params = {
    page,
    pageSize,
    where,
    price: req.query.price ? getPrice(req.query.price) : null,
    query: req.query.q && req.query.q.replace(/ /g, '&'),
    sort: req.query.sort || 'newest',
    other: req.query.other,
    brands: req.query.brands,
    services: req.query.services,
    address: req.query.address,
    userId: req.user.id,
    marketplaceId: req.marketplace.id,
    catalogId,
    storeId,
    isDropship,
  };
  const products = await Product.get(params, req.marketplace.mobile_domain);

  req.resData = {
    message: 'Products Data',
    meta: { page, limit: pageSize },
    data: products,
  };
  return next();
};

/**
 * Get search result
 */
ProductController.search = async (req, res, next) => {
  const results = await Product.search({
    query: req.query.q,
    category_id: req.query.category_id,
    store_id: req.query.store_id,
    catalog_id: req.query.catalog_id,
    marketplace_id: req.marketplace.id,
  });
  req.resData = {
    message: 'Products Search Result',
    data: results.map(val => ({ name: val.get('nama_produk') })),
  };
  return next();
};

ProductController.getProduct = async (req, res, next) => {
  const { productId, storeId } = getProductAndStore(req.params.id);
  const { product, idDropship } = await Product.getFullProduct(
    productId,
    storeId,
    req.user.id,
    req.marketplace.mobile_domain,
  );
  if (!product) throw getProductError('product', 'not_found');
  View.store(productId, requestIp.getClientIp(req), idDropship);
  product.share_link = Product.getShareLink(req.marketplace.mobile_domain, product);
  req.resData = {
    message: 'Product Detail Data',
    data: product,
  };
  return next();
};

ProductController.createProduct = async (req, res, next) => {
  const store = await Store.getStore(req.user.id);
  if (!store) throw getStoreError('store', 'not_found');
  if (store.get('verification_status') === StoreVerificationStatus.UNVERIFIED) {
    throw createProductError('store', 'unverified_store');
  } else if (store.get('verification_status') === StoreVerificationStatus.DEFAULT) {
    const limit = await Preference.get('unverified_store');
    const endDate = moment(store.get('tanggal_verifikasi'), 'YYYY-MM-DD').add(limit.value, 'd');
    const diff = endDate.diff(moment(), 'd');
    if (diff < 0) throw createProductError('store', 'unverified_store');
  }
  req.body.store_id = store.id;
  req.body.other_attr = '0';
  req.body.date_created = moment().toDate();
  req.body.date_status = req.body.date_created;
  if (req.body.is_insurance !== undefined) req.body.is_insurance = req.body.is_insurance ? 1 : 0;
  if (req.body.catalog_id) {
    if ((await Catalog.checkCatalog(req.body.store_id, req.body.catalog_id)) === false) {
      throw createProductError('catalog_id', 'catalog_not_found');
    }
  }
  const product = await new Product().save(Product.matchDBColumn(req.body), { method: 'insert' });
  const productId = product.get('id_produk');
  const expeditions = ProductExpedition.createBulk(productId, req.body.expeditions);
  const images = ImageProduct.createBulk(productId, req.body.images);
  const wholesales = (Array.isArray(req.body.wholesales) && req.body.wholesales.length > 0)
    ? Wholesale.createBulk(productId, req.body.wholesales) : [];
  await Promise.all([expeditions, images, wholesales]);
  req.resData = { data: product };
  return next();
};

/**
 * Add to wishlist
 */
ProductController.addWishlist = async (req, res, next) => {
  const { productId, storeId } = getProductAndStore(req.params.id);
  const productModel = await Product.findById(productId);
  let product = productModel.serialize();
  let dropshipperId = null;
  if (product.store_id !== storeId) {
    const dropship = await Dropship.findByProductIdAndStoreId(productId, storeId);
    if (!dropship) throw getProductError('product', 'not_found');
    dropshipperId = dropship.get('id_dropshipper');
  }
  product = {
    ...product,
    id: req.params.id,
    is_liked: await Wishlist.addWishlist(productId, req.user.id, dropshipperId),
  };
  req.resData = { data: product };
  return next();
};

/**
 * Get discussions
 */
ProductController.getDiscussions = async (req, res, next) => {
  const { productId, storeId } = getProductAndStore(req.params.id);
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const discussions = await Discussion.getByProductId(
    productId,
    storeId,
    page,
    pageSize,
    req.marketplace.mobile_domain,
  );
  req.resData = {
    message: 'Product Discussion Data',
    meta: { page, limit: pageSize },
    data: discussions,
  };
  return next();
};

/**
 * Get comments
 */
ProductController.getComments = async (req, res, next) => {
  const domain = req.marketplace.mobile_domain;
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const [discussion, comment] = await Promise.all([
    Discussion.where({ id_diskusi: req.params.id }).fetch({ withRelated: ['product.image', 'product.store', 'store'] }),
    Comment.getByDiscussionId(req.params.id, page, pageSize, req.query.page),
  ]);
  if (!discussion) throw getDiscussionError('discussion', 'not_found');
  let product = discussion.related('product');
  let store = discussion.get('id_toko') ? discussion.related('store') : product.related('store');
  store = store.serialize({ message: true }, domain);
  product = product.serialize({ minimal: true }, domain);
  product.id = `${product.id}.${store.id}`;
  req.resData = {
    message: 'Discussion Comments Data',
    meta: { page: comment.page === 0 ? 1 : comment.page, limit: pageSize },
    data: {
      product,
      store,
      comments: comment.comments.map(o => o.serialize({ minimal: true }, domain)),
    },
  };
  return next();
};

/**
 * Create discussion
 */
ProductController.createDiscussion = async (req, res, next) => {
  const { productId, storeId } = getProductAndStore(req.params.id);
  const product = await Product.findProduct(productId, storeId, true);
  const isFromDropship = !!product.get('id_dropshipper');
  const owner = product.related('store').related('user');
  let regToken = owner.get('reg_token');
  let userId = owner.get('id_users');
  let notifications = owner.serialize({ notification: true }).notifications;
  let data = {
    user_id: req.user.id,
    product_id: productId,
    store_id: product.get('id_toko'),
    question: req.body.question,
    is_deleted: 0,
    created_at: moment().toDate(),
  };
  if (isFromDropship) {
    regToken = product.get('reg_token');
    userId = product.get('u_id_users');
    notifications = product.get('notifications') || notificationDefault();
    data = {
      ...data,
      store_id: product.get('d_id_toko'),
      dropshipper_id: product.get('id_dropshipper'),
    };
  }
  if (userId === req.user.id) throw createDiscussionError('product', 'owner');
  data = Discussion.matchDBColumn(data);
  const discussion = await Discussion.create(data);
  if (regToken && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
    Notification.send(
      sellerNotification.CREATE_DISCUSSION,
      regToken,
      req.marketplace,
      {
        discussion_id: String(discussion.id),
        product_id: String(req.params.id),
        click_action: `notification-discussion-detail?id=${req.params.id}&idd=${discussion.id}`,
      },
    );
  }
  req.resData = {
    message: msg.createDiscussion.success,
    data: discussion,
  };
  return next();
};

/**
 * Create comment
 */
ProductController.createComment = async (req, res, next) => {
  const data = Comment.matchDBColumn({
    user_id: req.user.id,
    discussion_id: req.params.id,
    content: req.body.content,
    is_deleted: 0,
  });
  const comment = await Comment.create(data);
  await comment.load('discussion');
  const discussion = comment.related('discussion');
  const owner = await Product.getOwner(discussion.get('id_produk'));
  let notifications = owner.serialize({ notification: true }).notifications;

  if (owner.get('id_users') === req.user.id) {
    await discussion.load('user');
    const buyer = discussion.related('user');
    notifications = buyer.serialize({ notification: true }).notifications;

    if (buyer.get('reg_token') && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
      Notification.send(
        buyerNotification.COMMENT_DISCUSSION,
        buyer.get('reg_token'),
        req.marketplace,
        {
          discussion_id: String(discussion.id),
          product_id: String(req.params.id),
          click_action: `discussion/detail?id=${req.params.id}&idd=${discussion.id}`,
        },
      );
    }
  } else if (owner.get('reg_token') && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
    Notification.send(
      sellerNotification.COMMENT_DISCUSSION,
      owner.get('reg_token'),
      req.marketplace,
      {
        discussion_id: String(discussion.id),
        product_id: String(req.params.id),
        click_action: `notification-discussion-detail?id=${req.params.id}&idd=${discussion.id}`,
      },
    );
  }

  req.resData = {
    message: msg.createDiscussion.successComment,
    data: comment.serialize({ minimal: true }),
  };
  return next();
};

/**
 * Report product
 */
ProductController.report = async (req, res, next) => {
  const { productId } = getProductAndStore(req.params.id);
  const productModel = await Product.findById(productId);
  const data = Report.matchDBColumn({
    product_id: productId,
    user_id: req.user.id,
    type: req.body.report_type,
    description: req.body.description,
  });
  const report = await Report.create(data);
  ReportEmail.sendReportProduct(
    {
      to: config.komutoEmail,
      toName: config.komutoEmailName,
      from: req.marketplace.email_from,
      fromName: req.marketplace.name,
    },
    report.serialize(),
    productModel.serialize(),
    req.marketplace.mobile_domain,
  );
  req.resData = {
    message: 'Report Data',
    data: report,
  };
  return next();
};

/**
 * Dropship product
 */
ProductController.dropship = async (req, res, next) => {
  const { productId } = getProductAndStore(req.params.id);
  const catalogId = req.body.catalog_id;
  const storeId = await Store.getStoreId(req.user.id);

  const found = await Dropship.findByProductIdAndStoreId(productId, storeId);
  if (found) throw addDropshipProductError('product', 'duplicate');

  const [product, catalog] = await Promise.all([
    Product.where({ id_produk: productId }).fetch(),
    Catalog.where({ id_katalog: catalogId, id_toko: storeId }).fetch()]);

  if (!product.get('is_dropshiper')) throw addDropshipProductError('product', 'product_not_dropship');
  if (!catalog) throw addDropshipProductError('catalog', 'catalog_not_found');
  if (product.get('id_toko') === storeId) throw addDropshipProductError('product', 'own_product');

  const data = Dropship.matchDBColumn({
    product_id: productId,
    catalog_id: catalogId,
    store_id: storeId,
    status: DropshipStatus.SHOW,
    status_at: moment().toDate(),
    created_at: moment().toDate(),
  });
  const dropship = await Dropship.create(data);
  req.resData = {
    message: msg.createDropship.success,
    data: dropship,
  };
  return next();
};

/**
 * Delete dropship product
 */
ProductController.deleteDropship = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const dropship = await Dropship.findByProductIdAndStoreId(req.params.id, storeId);
  if (!dropship) throw getDropshipProductError('product', 'not_found');
  await dropship.destroy().catch(() => { throw deleteDropshipProductError('product', 'error'); });
  return next();
};

/**
 * Get store products
 */
ProductController.storeProducts = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const params = { storeId, marketplaceId: req.marketplace.id };
  const catalogs = await Catalog.getCatalogWithProducts(params, req.marketplace.mobile_domain);
  req.resData = {
    message: 'Store Products Data',
    data: catalogs,
  };
  return next();
};

/**
 * Get store products search
 */
ProductController.storeProductsSearch = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const masterFee = await MasterFee.findByMarketplaceId(req.marketplace.id);
  const params = {
    page,
    pageSize,
    storeId,
    query: req.query.q,
    catalogId: req.query.catalog_id,
    hidden: req.query.hidden !== undefined,
    masterFee,
  };
  const products = await Product.storeProductsSearch(params, req.marketplace.mobile_domain);
  req.resData = {
    message: 'Store Products Data',
    meta: { page, limit: pageSize },
    data: products,
  };
  return next();
};

/**
 * Get store products based on catalog id
 */
ProductController.storeCatalogProducts = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const catalogId = req.params.id || 0;
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const products = await Catalog.getCatalogWithProducts({
    storeId,
    catalogId,
    page,
    pageSize,
    marketplaceId: req.marketplace.id,
  }, req.marketplace.mobile_domain);
  if (!products.length) throw getCatalogProductsError('catalog_id', 'not_found');
  req.resData = {
    message: 'Store Catalog Products Data',
    meta: { page, limit: pageSize },
    data: products[0],
  };
  return next();
};

/**
 * Get hidden store products
 */
ProductController.hiddenStoreProducts = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const products = await Product.storeProducts({
    storeId,
    page,
    pageSize,
    hidden: true,
  }, req.marketplace);
  req.resData = {
    message: 'Hidden Store Products Data',
    meta: { page, limit: pageSize },
    data: products,
  };
  return next();
};

/**
 * Get store products based on catalog id for multiple check
 */
ProductController.listStoreCatalogProducts = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const catalogId = req.params.id || 0;
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const isDropship = req.query.is_dropship ? JSON.parse(req.query.is_dropship) : null;
  const hidden = req.query.hidden ? JSON.parse(req.query.hidden) : null;
  const products = await Product.storeProducts({
    catalogId,
    storeId,
    page,
    pageSize,
    isDropship,
    hidden,
  }, req.marketplace);
  req.resData = {
    message: 'Store Catalog Products Data',
    meta: { page, limit: pageSize },
    data: products,
  };
  return next();
};

/**
 * Hide products
 */
ProductController.hides = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  await Product.hides(storeId, req.body.product_ids);
  req.resData = { message: msg.createProduct.successHide };
  return next();
};

/**
 * Move catalog products
 */
ProductController.moveCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  await Catalog.findByIdAndStoreId(req.body.catalog_id, storeId);
  await Product.moveCatalog(storeId, req.body.product_ids, req.body.catalog_id);
  req.resData = { message: msg.createProduct.successMove };
  return next();
};

/**
 * Delete products
 */
ProductController.bulkDelete = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const errors = await Product.bulkDelete(storeId, req.body.product_ids);
  if (errors.length) throw new BadRequestError(msg.bulkDeleteProduct.title, errors);
  req.resData = { message: msg.bulkDeleteProduct.success };
  return next();
};

/**
 * Delete products
 */
ProductController.bulkUpdateDropship = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  await Product.bulkUpdateDropship(storeId, req.body.product_ids);
  return next();
};

/**
 * Get store product
 */
ProductController.getStoreProduct = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const product = await Product.getFullOwnProduct(req.params.id, storeId, req.marketplace);
  if (!product) throw getProductError('product', 'not_found');
  req.resData = {
    message: 'Product Detail Data',
    data: product,
  };
  return next();
};

/**
 * Update product
 */
ProductController.updateProduct = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  if (req.body.is_insurance !== undefined) req.body.is_insurance = req.body.is_insurance ? 1 : 0;
  const data = Product.matchDBColumn(req.body);
  const product = await Product.update(req.params.id, storeId, data);
  if (req.body.wholesales) await Wholesale.updateBulk(req.params.id, req.body.wholesales);
  if (req.body.images) {
    await ImageProduct.deleteBulk(req.params.id);
    await ImageProduct.createBulk(req.params.id, req.body.images);
  }
  if (req.body.expeditions) await ProductExpedition.updateBulk(req.params.id, req.body.expeditions);
  req.resData = {
    message: 'Product Data',
    data: product,
  };
  return next();
};

/**
 * Get product expedition manage
 */
ProductController.getProductExpeditionsManage = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const expeditions = await Product.getProductExpeditionsManage(
    req.params.id,
    storeId,
    req.marketplace.mobile_domain,
  );
  req.resData = {
    message: 'Product Expeditions Manage Data',
    data: expeditions,
  };
  return next();
};

ProductController.getDropshipProducts = async (req, res, next) => {
  req.body.is_dropship = true;
  req.query.store_id = await Store.getStoreId(req.user.id);
  return next();
};

ProductController.getCommission = async (req, res, next) => {
  const commission = await MasterFee.calculateCommission(
    req.marketplace.id,
    req.query.price,
    false,
    );
  req.resData = {
    message: 'Commission Data',
    data: { commission },
  };
  return next();
};

ProductController.getDropshipFaq = async (req, res, next) => {
  req.resData = {
    message: 'Dropship FAQ',
    data: dropshipFaq,
  };
  return next();
};
