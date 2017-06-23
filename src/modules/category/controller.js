import { Category } from './model';

export const CategoryController = {};
export default { CategoryController };

/**
 * Get categories
 */
CategoryController.getCategories = async (req, res, next) => {
  const id = typeof req.params.id !== 'undefined' ? req.params.id : 0;
  const categories = await Category.get({ parentid_kategoriproduk: id });
  req.resData = {
    status: true,
    message: 'Categories Data',
    data: categories,
  };
  return next();
};

/**
 * Get detail categories
 */
CategoryController.getDetailCategories = async (req, res, next) => {
  const categories = await Category.getDetail(req.params.id);
  req.resData = {
    status: true,
    message: 'Categories Data',
    data: categories,
  };
  return next();
};
