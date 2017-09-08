import { Review } from './model';
import { Store } from '../store/model';

export const ReviewController = {};
export default { ReviewController };

/**
 * Gel all reviews
 */
ReviewController.getReviews = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.getAll(
    req.params.id ? { product_id: req.params.id } : req.query,
    { page, pageSize },
  );

  req.resData = {
    message: 'Review List Data',
    meta: reviews.pagination,
    data: reviews.models,
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
    meta: reviews.pagination,
    data: reviews.models,
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
    meta: reviews.pagination,
    data: reviews.models,
  };
  return next();
};
