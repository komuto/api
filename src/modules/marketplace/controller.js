import { Marketplace } from './model';

export const MarketplaceController = {};
export default { MarketplaceController };

MarketplaceController.find = async (req, res, next) => {
  const marketplace = await Marketplace.findByDomain(req.query.domain);
  req.resData = {
    message: 'Marketplace Data',
    data: marketplace,
  };
  return next();
};

