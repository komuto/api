import { Review } from './model';
import { BadRequestError } from '../../../common/errors';

export const ReviewController = {};
export default { ReviewController };

ReviewController.createReview = async (req, res, next) => {
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

/**
 * Get individual review
 */
ReviewController.getReview = async (req, res, next) => {
  const review = await Review.getById(req.params.id);
  req.resData = {
    message: 'Review Data',
    data: review,
  };
  next();
};

/**
 * Gel all reviews on a product
 */
ReviewController.getProductReviews = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const reviews = await Review.getAll(
    { id_produk: req.params.id },
    { page, pageSize });

  req.resData = {
    message: 'Review List Data',
    meta: reviews.pagination,
    data: reviews.models,
  };
  return next();
};
