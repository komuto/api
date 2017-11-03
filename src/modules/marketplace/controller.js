import { Banner } from './model/banner';

export const MarketplaceController = {};
export default { MarketplaceController };

MarketplaceController.get = async (req, res, next) => {
  const { name, domain, mobile_domain, api_domain, fb_app_id, fb_app_secret } = req.marketplace;

  req.resData = {
    message: 'Marketplace Data',
    data: { name, domain, mobile_domain, api_domain, fb_app_id, fb_app_secret },
  };
  return next();
};

MarketplaceController.getBanners = async (req, res, next) => {
  const banners = await Banner.findByMarketplaceId(req.marketplace.id);

  req.resData = {
    message: 'Banners Data',
    data: banners,
  };
  return next();
};

MarketplaceController.getManifest = async (req, res) => res.json(req.marketplace.manifest);
