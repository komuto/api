import { Banner } from './model/banner';

export const MarketplaceController = {};
export default { MarketplaceController };

MarketplaceController.get = async (req, res, next) => {
  const { name, domain, mobile_domain, api_domain } = req.marketplace;
  const version = '1.0';

  req.resData = {
    message: 'Marketplace Data',
    data: { name, domain, mobile_domain, api_domain, version },
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

MarketplaceController.getManifest = async (req, res) => {
  const manifest = {
    "name": "Komuto PWA",
    "short_name": "Komuto",
    "icons": [
      {
        "src": "/static/img/icons/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/static/img/icons/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#ef5656",
    "background_color": "#fff",
    "gcm_sender_id": "103953800507"
  };

  return res.json(manifest);
};
