import { Store, FavoriteStore, Message, DetailMessage } from './model';
import { makeFavoriteError } from './error';

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
