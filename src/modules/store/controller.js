import { Store, Catalog, FavoriteStore, Message, DetailMessage } from './model';
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

/**
 * Favorite a store
 */
StoreController.makeFavorite = async (req, res, next) => {
  const data = {
    id_users: req.user.id,
    referred_toko: req.params.id,
    referred_marketplace: await Store.getMarketplaceId(req.params.id) || 0,
  };
  const storeId = await Store.getStoreId(req.user.id);
  if (parseInt(req.params.id, 10) === storeId) throw makeFavoriteError('store', 'not_valid');
  const favorite = await FavoriteStore.where({ status_tokofavorit: '1', ...data }).fetch({ columns: 'id_tokofavorit' });
  if (favorite) throw makeFavoriteError('store', 'repeat_favorite');
  await FavoriteStore.create(data);
  return next();
};

StoreController.createMessage = async (req, res, next) => {
  const messageObj = Message.matchDBColumn({
    user_id: req.user.id,
    store_id: req.params.id,
    subject: req.body.subject,
    flag_sender: 2,
    flag_receiver: 2,
    flag_sender_at: new Date(),
    flag_receiver_at: new Date(),
  });
  const message = await Message.create(messageObj);

  const detailMessageObj = DetailMessage.matchDBColumn({
    message_id: message.toJSON().id,
    user_id: req.user.id,
    content: req.body.content,
    created_at: new Date(),
  });
  const detailMessage = await DetailMessage.create(detailMessageObj);
  req.resData = {
    message: 'Message Data',
    data: { message, detailMessage },
  };
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

/**
 * Create store catalog
 */
StoreController.createCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const data = {
    store_id: storeId,
    name: req.body.name,
    created_at: new Date(),
  };
  const catalog = await Catalog.create(data);
  req.resData = {
    message: 'Success',
    data: catalog,
  };
  return next();
};

/**
 * Get catalog
 */
StoreController.getCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const catalog = await Catalog.findByIdAndStoreId(req.params.id, storeId);
  req.resData = {
    message: 'Catalog Data',
    data: catalog,
  };
  return next();
};

/**
 * Update catalog
 */
StoreController.updateCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const data = Catalog.matchDBColumn({ name: req.body.name });
  const catalog = await Catalog.update(req.params.id, storeId, data);
  req.resData = {
    message: 'Catalog Data',
    data: catalog,
  };
  return next();
};
