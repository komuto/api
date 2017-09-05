import moment from 'moment';
import requestIp from 'request-ip';
import {
  Product,
  ProductCondition,
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
import { Wishlist, getNotification, NotificationType } from '../user/model';
import { Store, Catalog } from '../store/model';
import {
  getProductError,
  createProductError,
  getCatalogProductsError,
  addDropshipProductError,
  errMsg,
  createDiscussionError,
} from './messages';
import { ReportEmail } from './email';
import config from './../../../config';
import { BadRequestError } from './../../../common/errors';
import core from '../core';

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
  const { category_id, condition: cond, store_id: storeId } = req.body;
  const condition = cond && (cond === 'new' ? ProductCondition.NEW : ProductCondition.USED);
  const where = Product.matchDBColumn({ condition, category_id });
  const params = {
    page,
    pageSize,
    where,
    price: req.query.price ? getPrice(req.query.price) : null,
    query: req.query.q && req.query.q.replace(' ', '&'),
    sort: req.query.sort || 'newest',
    other: req.query.other,
    brands: req.query.brands,
    services: req.query.services,
    address: req.query.address,
    userId: req.user.id,
    marketplaceId: req.marketplace.id,
  };
  const products = await Product.get(params, storeId);

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
  const results = await Product.search(req.query.q);
  req.resData = {
    message: 'Products Search Result',
    data: results,
  };
  return next();
};

ProductController.getProduct = async (req, res, next) => {
  const { productId, storeId } = getProductAndStore(req.params.id);
  const product = await Product.getFullProduct(productId, storeId, req.user.id);
  if (!product) throw getProductError('product', 'not_found');
  View.store(productId, requestIp.getClientIp(req));
  req.resData = {
    message: 'Product Detail Data',
    data: product,
  };
  return next();
};

ProductController.createProduct = async (req, res, next) => {
  req.body.store_id = await Store.getStoreId(req.user.id);
  req.body.other_attr = '0';
  req.body.date_created = moment();
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
  req.resData = {
    message: 'Product Data',
    data: product,
  };
  return next();
};

/**
 * Add to wishlist
 */
ProductController.addWishlist = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  product.is_liked = await Wishlist.addWishlist(req.params.id, req.user.id);
  req.resData = {
    data: product,
  };
  return next();
};

/**
 * Get discussions
 */
ProductController.getDiscussions = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const discussions = await Discussion.getByProductId(req.params.id, page, pageSize);
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
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const comments = await Comment.getByDiscussionId(req.params.id, page, pageSize);
  req.resData = {
    message: 'Discussion Comments Data',
    meta: { page, limit: pageSize },
    data: comments.serialize({ minimal: true }),
  };
  return next();
};

/**
 * Create discussion
 */
ProductController.createDiscussion = async (req, res, next) => {
  const owner = await Product.getOwner(req.params.id);
  if (owner.get('id_users') === req.user.id) throw createDiscussionError('product', 'owner');
  const data = Discussion.matchDBColumn({
    user_id: req.user.id,
    product_id: req.params.id,
    question: req.body.question,
    is_deleted: 0,
    created_at: moment(),
  });
  const discussion = await Discussion.create(data);
  const notifications = owner.serialize({ notification: true }).notifications;
  if (getNotification(notifications, NotificationType.PRIVATE_MESSAGE) && owner.get('reg_token')) {
    Notification.send(sellerNotification.DISCUSSION, owner.get('reg_token'), discussion.toJSON().id, req.params.id);
  }
  req.resData = {
    message: 'Discussion Data',
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
    created_at: moment(),
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

    if (getNotification(notifications, NotificationType.PRIVATE_MESSAGE) && buyer.get('reg_token')) {
      Notification.send(buyerNotification.DISCUSSION, buyer.get('reg_token'), discussion.toJSON().id, discussion.toJSON().product_id);
    }
  } else if (getNotification(notifications, NotificationType.PRIVATE_MESSAGE) && owner.get('reg_token')) {
    Notification.send(sellerNotification.DISCUSSION, owner.get('reg_token'), discussion.toJSON().id, discussion.toJSON().product_id);
  }

  req.resData = {
    message: 'Comment Data',
    data: comment.serialize({ minimal: true }),
  };
  return next();
};

/**
 * Report product
 */
ProductController.report = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  const data = Report.matchDBColumn({
    product_id: req.params.id,
    user_id: req.user.id,
    type: req.body.report_type,
    description: req.body.description,
  });
  const report = await Report.create(data);
  ReportEmail.sendReportProduct(config.komutoEmail, report.serialize(), product);
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
  const productId = req.params.id;
  const catalogId = req.body.catalog_id;
  const storeId = await Store.getStoreId(req.user.id);

  const found = await Dropship.findDuplicate(productId, storeId);
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
    status_at: moment(),
    created_at: moment(),
  });
  const dropship = await Dropship.create(data);
  req.resData = {
    message: 'Dropship Data',
    data: dropship,
  };
  return next();
};

/**
 * Get store products
 */
ProductController.storeProducts = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const params = { storeId, marketplaceId: req.marketplace.id };
  const catalogs = await Catalog.getCatalogWithProducts(params);
  req.resData = {
    message: 'Store Products Data',
    data: catalogs,
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
  });
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
  });
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
  const isDropship = req.query.is_dropship ? JSON.parse(req.query.is_dropship) : false;
  const products = await Product.storeProducts({
    catalogId,
    storeId,
    page,
    pageSize,
    isDropship,
  });
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
  return next();
};

/**
 * Move catalog products
 */
ProductController.moveCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  await Catalog.findByIdAndStoreId(req.body.catalog_id, storeId);
  await Product.moveCatalog(storeId, req.body.product_ids, req.body.catalog_id);
  return next();
};

/**
 * Delete products
 */
ProductController.bulkDelete = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const errors = await Product.bulkDelete(storeId, req.body.product_ids);
  if (errors.length) throw new BadRequestError(errMsg.bulkDeleteProduct.title, errors);
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
  const product = await Product.getFullOwnProduct(req.params.id, storeId, req.marketplace.id);
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
  const expeditions = await Product.getProductExpeditionsManage(req.params.id, storeId);
  req.resData = {
    message: 'Product Expeditions Manage Data',
    data: expeditions,
  };
  return next();
};

ProductController.getDropshipProducts = async (req, res, next) => {
  req.body.store_id = await Store.getStoreId(req.user.id);
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
