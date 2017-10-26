export const MarketplaceController = {};
export default { MarketplaceController };

MarketplaceController.get = async (req, res, next) => {
  const { name, domain, mobile_domain, api_domain } = req.marketplace;
  req.resData = {
    message: 'Marketplace Data',
    data: { name, domain, mobile_domain, api_domain },
  };
  return next();
};

