import _ from 'lodash';
import { Product } from './model';

export const ProductController = {};
export default { ProductController };

/**
 * Get products
 */
ProductController.index = async (req, res, next) => {
  const page = req.param('page') ? parseInt(req.param('page'), 10) : 1;
  const size = req.param('size') ? parseInt(req.param('size'), 10) : 10;
  const condition = { id_kategoriproduk: req.param('category_id') };
  const products = await Product.get(page, size, condition);
  const data = [];

  _.forEach(products.models, (product) => {
    const store = product.related('store');
    const images = product.related('imageProducts');
    data.push({ product, store, images });
  });

  req.resData = {
    status: true,
    message: 'Products Data',
    meta: { page, size },
    data,
  };
  return next();
};
