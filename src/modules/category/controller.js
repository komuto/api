import Category from './model';
import { Brand } from '../brand';

export const CategoryController = {};
export default { CategoryController };

/**
 * Get categories
 */
CategoryController.getCategories = async (req, res, next) => {
  const id = typeof req.params.id !== 'undefined' ? req.params.id : 0;
  const categories = await Category.get({ parentid_kategoriproduk: id });
  req.resData = {
    message: 'Categories Data',
    data: categories,
  };
  return next();
};

CategoryController.getFullCategories = async (req, res, next) => {
  const categories = await Category.getFullCategories();
  req.resData = {
    message: 'Category List Data',
    data: categories,
  };
  return next();
};

CategoryController.getBrands = async (req, res, next) => {
  const brands = await Brand.get({ id_kategoriproduk: req.params.id });
  req.resData = {
    status: true,
    message: 'Brands List Data',
    data: brands,
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
