import Category from './model';
import { Brand } from '../brand';

export const CategoryController = {};
export default { CategoryController };

CategoryController.getDetailCategories = async (req, res, next) => {
  const categories = await Category.getDetailCategories(req.params.id, req.marketplace.mobile_domain);
  req.resData = {
    message: 'Category List Data',
    data: categories,
  };
  return next();
};

CategoryController.getFullCategories = async (req, res, next) => {
  const categories = await Category.getFullCategories(req.marketplace.mobile_domain);
  req.resData = {
    message: 'Category List Data',
    data: categories,
  };
  return next();
};

CategoryController.getBrands = async (req, res, next) => {
  const brands = await Brand.get({ id_kategoriproduk: req.params.id });
  req.resData = {
    message: 'Brands List Data',
    data: brands,
  };
  return next();
};

/**
 * Get detail categories
 */
CategoryController.getListCategories = async (req, res, next) => {
  let categories = await Category.get({ parentid_kategoriproduk: 0 });
  categories = categories.map(category => category.serialize(req.marketplace.mobile_domain));
  req.resData = {
    message: 'Category List Data',
    data: categories,
  };
  return next();
};
