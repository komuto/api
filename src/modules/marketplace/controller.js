import _ from 'lodash';
import { Banner } from './model/banner';
import { MasterFee } from '../product/model';

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

MarketplaceController.getCommission = async (req, res, next) => {
  let fees = await MasterFee.findByMarketplaceId(req.marketplace.id);
  fees = fees.map(fee => fee.serialize());

  req.resData = { data: { commission: _.maxBy(fees, 'fee').fee } };
  return next();
};

MarketplaceController.getBanners = async (req, res, next) => {
  let banners = await Banner.findByMarketplaceId(req.marketplace.id);

  banners = banners.map((banner) => {
    banner = banner.serialize(req.marketplace.mobile_domain);
    if (banner.link.includes('/detail/')) {
      const sArr = banner.link.split('.');
      const pArr = sArr[sArr.length - 2].split('-');
      const storeId = sArr[sArr.length - 1];
      const productId = pArr[pArr.length - 1];

      return {
        ...banner,
        product_id: `${productId}.${storeId}`,
      };
    }

    return {
      ...banner,
      product_id: null,
    };
  });

  req.resData = {
    message: 'Banners Data',
    data: banners,
  };
  return next();
};

MarketplaceController.getManifest = async (req, res) => res.json(req.marketplace.manifest);
