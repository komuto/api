import { Store, Catalog, FavoriteStore } from './model';
import { makeFavoriteError, deleteCatalogError } from './error';

export const StoreController = {};
export default { StoreController };

StoreController.getStore = async (req, res, next) => {
  const store = await Store.getFullStore(req.params.id);
  req.resData = {
    message: 'Store Detail Data',
    data: store,
  };
  return next();
};

StoreController.makeFavorite = async (req, res, next) => {
  const data = {
    id_users: req.user.id,
    referred_toko: req.params.id,
    referred_marketplace: await Store.getMarketplaceId(req.params.id) || 0,
  };
  const favorite = await FavoriteStore.where({ status_tokofavorit: '1', ...data }).fetch({ columns: 'id_tokofavorit' });
  if (favorite) throw makeFavoriteError('store', 'repeat_favorite');
  await FavoriteStore.create(data);
  return next();
};

/**
 * Get store catalog
 */
StoreController.getUserCatalog = async (req, res, next) => {
  const catalogs = await Catalog.getUserCatalog(req.user.id);
  req.resData = {
    message: 'Store Catalog Data',
    data: catalogs,
  };
  return next();
};

StoreController.deleteCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const catalog = await Catalog.where({ id_toko: storeId, id_katalog: req.params.id }).fetch();
  if (!catalog) throw deleteCatalogError('catalog', 'not_found');
  if (await Catalog.checkProduct(req.params.id)) throw deleteCatalogError('catalog', 'has_product');
  await catalog.destroy();
  return next();
};
