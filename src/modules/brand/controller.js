import Brand from './model';

export const BrandController = {};
export default { BrandController };

/**
 * Get brands
 */
BrandController.index = async (req, res, next) => {
  const brands = await Brand.get({ id_kategoriproduk: req.query.category_id });
  req.resData = {
    status: true,
    message: 'Brands Data',
    data: brands,
  };
  return next();
};
