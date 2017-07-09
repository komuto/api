import { Store, FavoriteStore } from './model';
import { utils } from '../core';
import { BadRequestError } from '../../../common/errors';
import { favoriteMsg } from './message';

const { formatSingularErr } = utils;

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
  const favorite = new FavoriteStore({ status_tokofavorit: '1', ...data }).fetch();
  if (favorite) throw new BadRequestError(favoriteMsg.title, formatSingularErr('repeat_favorite', favoriteMsg.repeat_favorite));
  await FavoriteStore.create(data);
  return next();
};
