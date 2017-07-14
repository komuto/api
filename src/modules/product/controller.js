import { Product, Discussion, Comment } from './model';
import { Wishlist } from './../user/model';
import { BadRequestError } from '../../../common/errors';
import { utils } from '../core';
import { getMsg } from './message';

const { formatSingularErr } = utils;

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
  if (!product) throw new BadRequestError(getMsg.title, formatSingularErr('product', getMsg.not_found));
  req.resData = {
    message: 'Product Detail Data',
    data: product,
  };
  return next();
};

/**
 * Add to wishlist
 */
ProductController.addWishlist = async (req, res, next) => {
  await Wishlist.addWishlist(req.params.id, req.user.id);
  req.resData = {
    message: 'Success',
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
    created_at: new Date(),
  });
  const discussion = await Discussion.create(data);
  req.resData = {
    message: 'Discussion Data',
    data: discussion,
  };
  return next();
};

