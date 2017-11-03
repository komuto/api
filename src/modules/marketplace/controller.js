import { Banner } from './model/banner';

export const MarketplaceController = {};
export default { MarketplaceController };

MarketplaceController.get = async (req, res, next) => {
  const { name, domain, mobile_domain, api_domain } = req.marketplace;
  const version = '1.0';
  const manifest = {
    "name": "My Progressive Web Application",
    "short_name": "Progressive",
    "start_url": "/?home=true",
    "icons": [
      {
        "src": "/icons/icon36.png",
        "sizes": "36x36",
        "type": "image/png"
      },
      {
        "src": "/icons/icon48.png",
        "sizes": "48x48",
        "type": "image/png"
      },
      {
        "src": "/icons/icon60.png",
        "sizes": "60x60",
        "type": "image/png"
      },
      {
        "src": "/icons/icon72.png",
        "sizes": "72x72",
        "type": "image/png"
      },
      {
        "src": "/icons/icon76.png",
        "sizes": "76x76",
        "type": "image/png"
      },
      {
        "src": "/icons/icon96.png",
        "sizes": "96x96",
        "type": "image/png"
      },
      {
        "src": "/icons/icon120.png",
        "sizes": "120x120",
        "type": "image/png"
      },
      {
        "src": "/icons/icon152.png",
        "sizes": "152x152",
        "type": "image/png"
      },
      {
        "src": "/icons/icon180.png",
        "sizes": "180x180",
        "type": "image/png"
      },
      {
        "src": "/icons/icon192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icons/icon512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ],
    "theme_color": "#000000",
    "background_color": "#FFFFFF",
    "display": "fullscreen",
    "orientation": "portrait",
    "gcm_sender_id": "103953800507"
  };

  req.resData = {
    message: 'Marketplace Data',
    data: { name, domain, mobile_domain, api_domain, version, manifest },
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

