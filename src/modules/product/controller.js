import _ from 'lodash';
import { Product } from './model';

export const ProductController = {};
export default { ProductController };

/**
 * Get products
 */
ProductController.index = async (req, res, next) => {
  const page = req.param('page') ? parseInt(req.param('page'), 10) : 1;
  const limit = req.param('limit') ? parseInt(req.param('limit'), 10) : 10;
  const condition = { id_kategoriproduk: req.param('category_id') };
  const query = req.param('q');
  const sort = req.param('sort');
  const products = await Product.get(page, limit, condition, query, sort);
  const data = [];

  _.forEach(products.models, (product) => {
    const store = product.related('store');
    const images = product.related('imageProducts');
    data.push({ product, store, images });
  });

  req.resData = {
    status: true,
    message: 'Products Data',
    meta: { page, limit },
    data,
  };
  return next();
};

/**
 * Get search result
 */
ProductController.search = async (req, res, next) => {
  const results = await Product.search(req.param('q'));
  req.resData = {
    status: true,
    message: 'Products Search Result',
    data: results,
  };
  return next();
};
