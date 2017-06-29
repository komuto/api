import { Product, Review } from './model';
import { BadRequestError } from '../../../common/errors';

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
  const price = req.query.price ? getPrice(req.query.price) : null;
  const params = {
    page,
    pageSize,
    price,
    where: { id_kategoriproduk: req.query.category_id },
    query: req.query.q,
    sort: req.query.sort,
    condition: req.query.condition,
    other: req.query.other,
    brands: req.query.brands,
    services: req.query.services,
    address: req.query.address,
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

ProductController.createReview = async (req, res, next) => {
  req.body.user_id = req.user.id;
  req.body.product_id = req.params.id;
  if (!await Review.getByOtherId(req.user.id, req.params.id)) {
    await Review.create(Review.matchDBColumn(req.body));
  } else {
    return next(new BadRequestError('Create review failed',
      { id: ['You have already submitted your review for this product'] }));
  }
  return next();
};

ProductController.getReviews = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.get(
    { id_produk: req.params.id },
    { page, pageSize });

  req.resData = {
    message: 'Review List Data',
    meta: reviews.pagination,
    data: reviews.models,
  };
  return next();
};

