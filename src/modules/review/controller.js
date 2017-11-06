import { Review } from './model';
import { Store } from '../store/model';
import { getProductAndStore } from '../core/utils';

export const ReviewController = {};
export default { ReviewController };

/**
 * Gel all reviews
 */
ReviewController.getReviews = async (req, res, next) => {
  const { productId = null, storeId } = req.params.id ? getProductAndStore(req.params.id) : {};
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.getAll(
    productId ? { product_id: productId, store_id: storeId } : req.query,
    { page, pageSize },
  );

  req.resData = {
    message: 'Review List Data',
    meta: { page, limit: pageSize },
    data: reviews,
  };
  return next();
};

/**
 * Gel all reviews of user
 */
ReviewController.getUserReviews = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.getAll({ user_id: req.user.id }, { page, pageSize }, true);

  req.resData = {
    message: 'Review List Data',
    meta: { page, limit: pageSize },
    data: reviews,
  };
  return next();
};

/**
 * Gel all reviews of store
 */
ReviewController.getStoreReviews = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.getAll({ store_id: storeId }, { page, pageSize }, true);

  req.resData = {
    message: 'Review List Data',
    meta: { page, limit: pageSize },
    data: reviews,
  };
  return next();
};
