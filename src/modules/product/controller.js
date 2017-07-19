import moment from 'moment';
import requestIp from 'request-ip';
import {
  Product,
  Discussion,
  Comment,
  Report,
  Wholesale,
  ImageProduct,
  ExpeditionProduct,
  ProductStatus,
  Dropship,
  DropshipStatus,
  View,
} from './model';
import { Wishlist } from './../user/model';
import { model as storeModel } from '../store';
import { getProductError, createProductError } from './error';
import { ReportEmail } from './email';
import config from './../../../config';

const { Store, Catalog } = storeModel;

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
  let page = req.query.page ? parseInt(req.query.page, 10) : 1;
  if (!page) page = 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const price = req.query.price ? getPrice(req.query.price) : null;
  const params = {
    page,
    pageSize,
    price,
    where: { id_kategoriproduk: req.query.category_id },
    query: req.query.q,
    sort: req.query.sort || 'newest',
    condition: req.query.condition,
    other: req.query.other,
    brands: req.query.brands,
    services: req.query.services,
    address: req.query.address,
    userId: req.user.id,
  };
  const products = await Product.get(params);

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
  const product = await Product.getFullProduct(req.params.id, req.user.id);
  if (!product) throw getProductError('product', 'not_found');
  View.store(req.params.id, requestIp.getClientIp(req));
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
  req.body.status = ProductStatus.SHOW;
  if (req.body.catalog_id) {
    if ((await Catalog.checkCatalog(req.body.store_id, req.body.catalog_id)) === false) {
      throw createProductError('catalog_id', 'catalog_not_found');
    }
  }
  const product = await new Product().save(Product.matchDBColumn(req.body), { method: 'insert' });
  const productId = product.get('id_produk');
  const expeditions = ExpeditionProduct.createBulk(productId, req.body.expeditions);
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
  const comments = await Comment.getByDiscussionId(req.params.discussion_id, page, pageSize);
  req.resData = {
    message: 'Discussion Comments Data',
    meta: { page, limit: pageSize },
    data: comments,
  };
  return next();
};

/**
 * Create discussion
 */
ProductController.createDiscussion = async (req, res, next) => {
  const data = Discussion.matchDBColumn({
    user_id: req.user.id,
    product_id: req.params.id,
    question: req.body.question,
    is_deleted: 0,
    created_at: moment(),
  });
  const discussion = await Discussion.create(data);
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
    discussion_id: req.params.discussion_id,
    content: req.body.content,
    created_at: moment(),
    is_deleted: 0,
  });
  const comment = await Comment.create(data);
  req.resData = {
    message: 'Comment Data',
    data: comment,
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
  const storeId = await Store.getStoreId(req.user.id);
  const data = Dropship.matchDBColumn({
    product_id: req.params.id,
    catalog_id: req.body.catalog_id,
    store_id: storeId,
    status: DropshipStatus.SELECTED,
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

