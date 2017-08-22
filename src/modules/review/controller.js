import { Review } from './model';
import { createReviewError } from './messages';

export const ReviewController = {};
export default { ReviewController };

ReviewController.createReview = async (req, res, next) => {
  req.body.user_id = req.user.id;
  req.body.product_id = req.params.id;
  if (await Review.getByOtherId(req.user.id, req.params.id)) throw createReviewError('review', 'duplicate');
  const review = await Review.create(Review.matchDBColumn(req.body));
  req.resData = { data: review };
  return next();
};

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
