import moment from 'moment';
import _ from 'lodash';
import {
  Store,
  Catalog,
  FavoriteStore,
  FavoriteStoreStatus,
  Message,
  DetailMessage,
  MessageFlagStatus,
  MessageType,
  StoreExpedition,
  StoreStatus,
} from './model';
import { makeFavoriteError, deleteCatalogError, createMessageError } from './messages';
import { OTPAddress } from './../OTP/model';
import { Address } from './../address/model';
import { User, getNotification, NotificationType } from './../user/model';
import { OTPAddressEmail } from '../OTP/email';
import { Invoice, InvoiceTransactionStatus, Dispute } from '../payment/model';
import config from '../../../config';
import core from '../core';

const { Notification, sellerNotification, buyerNotification } = core;

export const StoreController = {};
export default { StoreController };

StoreController.getStore = async (req, res, next) => {
  const store = await Store.getFullStore(req.params.id, req.user.id, req.marketplace.id);
  req.resData = {
    message: 'Store Detail Data',
    data: store,
  };
  return next();
};

/**
 * Favorite a store
 */
StoreController.favorite = async (req, res, next) => {
  const [marketplace, store] = await Promise.all([
    Store.getMarketplaceId(req.params.id),
    Store.where({ id_users: req.user.id }).fetch(),
  ]);
  if (marketplace === false || marketplace !== req.marketplace.id) throw makeFavoriteError('store', 'not_found');
  if (store && Number(req.params.id) === store.get('id_toko')) throw makeFavoriteError('store', 'not_valid');

  const data = {
    id_users: req.user.id,
    referred_toko: req.params.id,
    referred_marketplace: marketplace,
  };
  const favorite = await FavoriteStore.where({
    status_tokofavorit: FavoriteStoreStatus.ON,
    ...data,
  }).fetch({ columns: 'id_tokofavorit' });

  let isFavorite = true;
  if (favorite) {
    await favorite.destroy();
    isFavorite = false;
  } else {
    await FavoriteStore.create(data);
  }
  req.resData = { data: { is_favorite: isFavorite } };
  return next();
};

StoreController.listFavorites = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const favorites = await FavoriteStore.getListFavoriteStore(
    req.user.id,
    req.marketplace.id,
    req.query.q,
    pageSize,
    page,
  );

  req.resData = {
    message: 'Favorite store',
    meta: { page, limit: pageSize },
    data: favorites,
  };
  return next();
};

const buildMessage = messageType => async (req, res, next) => {
  const getInvoice = Invoice.getWithDropship(req.params.id);
  const getStore = Store.getStoreId(req.user.id);
  const [invoice, storeId] = await Promise.all([getInvoice, getStore]);
  const resellerStore = Number(invoice.related('item').related('dropship').get('id_toko'));
  let compareStore;
  let type;
  let storeToMessage;
  if (messageType === 'messageBuyer') {
    compareStore = invoice.related('item').get('id_dropshipper') === null ? Number(invoice.get('id_toko')) : resellerStore;
    type = MessageType.SELLER_TO_BUYER;
    storeToMessage = storeId;
    req.body.user_id = invoice.get('id_user');
  } else if (messageType === 'messageSeller') {
    compareStore = resellerStore;
    type = MessageType.RESELLER_TO_SELLER;
    storeToMessage = invoice.get('id_toko');
  } else if (messageType === 'messageReseller') {
    compareStore = Number(invoice.get('id_toko'));
    type = MessageType.SELLER_TO_RESELLER;
    storeToMessage = resellerStore;
  }
  if (compareStore !== storeId) throw createMessageError('invoice', 'invoice_not_found');
  req.body = {
    ...req.body,
    invoice_id: req.params.id,
    store_id: storeToMessage,
    type,
  };
  return next();
};

// id_toko on message table is the sender
StoreController.messageBuyer = buildMessage('messageBuyer');
// id_user on message table is the sender
StoreController.messageSeller = buildMessage('messageSeller');
// id_user on message table is the sender
StoreController.messageReseller = buildMessage('messageReseller');

StoreController.createMessage = async (req, res, next) => {
  const findStore = !req.body.invoice_id ? req.params.id : req.body.store_id;
  const store = !req.body.user_id && await Store.findById(findStore);
  const storeOwner = store ? store.related('user') : await User.where('id_users', req.body.user_id);
  if (!req.body.invoice_id && storeOwner.get('id_users') === req.user.id) throw createMessageError('store', 'own_store');
  const type = req.body.type || MessageType.BUYER_TO_SELLER;
  const messageObj = Message.matchDBColumn({
    user_id: req.body.user_id || req.user.id,
    store_id: req.body.store_id || req.params.id,
    subject: req.body.subject,
    flag_sender: MessageFlagStatus.UNREAD,
    flag_receiver: MessageFlagStatus.UNREAD,
    flag_sender_at: moment().toDate(),
    flag_receiver_at: moment().toDate(),
    parent_id: req.body.invoice_id,
    type,
  });
  const message = await Message.create(messageObj);
  const detailMessageObj = DetailMessage.matchDBColumn({
    message_id: message.toJSON().id,
    user_id: req.user.id,
    content: req.body.content,
    created_at: moment().toDate(),
  });
  const detailMessage = await DetailMessage.create(detailMessageObj);
  const notifications = storeOwner.serialize({ notification: true }).notifications;
  if (storeOwner.get('reg_token') && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
    const notify = type === MessageType.SELLER_TO_BUYER
      ? buyerNotification.MESSAGE : sellerNotification.MESSAGE;
    const action = type === MessageType.SELLER_TO_BUYER
      ? `message-detail?id=${message.id}`
      : `notification-message-detail?id=${message.id}`;
    Notification.send(
      notify,
      storeOwner.get('reg_token'),
      req.marketplace,
      { message_id: String(message.id), click_action: action },
    );
  }
  req.resData = {
    message: 'Message Data',
    data: { message, detail_message: detailMessage },
  };
  return next();
};

/**
 * Get store catalog
 */
StoreController.getUserCatalog = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const catalogs = await Catalog.getStoreCatalog(storeId);
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
    created_at: moment().toDate(),
  };
  req.resData = {
    data: await Catalog.create(data),
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

/**
 * Verify Store
 */
StoreController.verify = async (req, res, next) => {
  await OTPAddress.verify(req.user.id, req.body.code);
  await Store.updateVerification(req.user.id);
  return next();
};

/**
 * Create store
 */
StoreController.createStore = async (req, res, next) => {
  const expeditionServices = req.body.expedition_services;
  const storeData = _.assign(req.body.store, {
    user_id: req.user.id,
    status: StoreStatus.ACTIVE,
    seller_theme_id: 0,
    store_id_number: req.body.user.id_number,
    created_at: moment().toDate(),
    status_at: moment().toDate(),
  });
  const store = await Store.create(Store.matchDBColumn(storeData));
  const user = await User.update({ id_users: req.user.id }, User.matchDBColumn(req.body.user));

  const addressData = _.assign(req.body.address, {
    is_sale_address: 1,
    is_primary: 0,
    is_tender_address: 0,
    user_id: req.user.id,
    alias_address: req.body.address.address,
    name: req.user.name,
    phone_number: req.user.phone_number,
    email: req.user.email,
  });
  const address = await Address.create(Address.matchDBColumn(addressData));

  const services = expeditionServices.map(data => (StoreExpedition.matchDBColumn(data, true)));
  await Store.createExpeditionServices(store, services);
  const otp = await OTPAddress.create(req.user.id);

  const data = {
    address,
    user: req.user,
    store: store.serialize(),
    otp: otp.serialize(),
  };
  OTPAddressEmail.sendOtpAddress(config.komutoEmail, data);

  req.resData = {
    message: 'Store Data',
    data: { store, user, address, expedition_services: expeditionServices },
  };
  return next();
};

/**
 * Update Store
 */
StoreController.updateStore = async (req, res, next) => {
  const { slogan, description, logo } = req.body;
  const store = await Store.update(Store.matchDBColumn({ slogan, description, logo }), req.user.id);
  req.resData = { data: store };
  return next();
};

/**
 * Get Messages
 */
StoreController.getMessages = async (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const storeId = await Store.getStoreId(req.user.id);
  const isArchived = req.query.is_archived ? req.query.is_archived : false;
  const messages = await Message.getById(storeId, 'store', JSON.parse(isArchived), page, pageSize);
  req.resData = {
    message: 'Message Data',
    meta: { page, limit: pageSize },
    data: messages,
  };
  return next();
};

/**
 * Get Detail Message
 */
StoreController.getMessage = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const message = await Message.findById(req.params.id, storeId, 'store', req.marketplace.mobile_domain);
  req.resData = {
    message: 'Detail Message Data',
    data: message,
  };
  return next();
};

/**
 * Update Flag Message
 */
StoreController.updateMessage = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const flag = req.body.type === 'archive' ? MessageFlagStatus.ARCHIVE : MessageFlagStatus.READ;
  const message = await Message.updateFlag(req.params.id, storeId, 'store', flag);
  req.resData = { data: message };
  return next();
};

/**
 * Delete Message
 */
StoreController.deleteMessage = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  await Message.updateFlag(req.params.id, storeId, 'store', MessageFlagStatus.PERMANENT_DELETED);
  return next();
};

/**
 * Reply Message
 */
StoreController.replyMessage = async (req, res, next) => {
  const store = await Store.getStoreByUserId(req.user.id);
  const msg = await Message.findById(req.params.id, store.get('id_toko'), 'store');
  const data = DetailMessage.matchDBColumn(_.assign(req.body, {
    message_id: req.params.id,
    user_id: req.user.id,
    created_at: moment().toDate(),
  }));
  const detailMessage = await DetailMessage.create(data);
  const buyer = await User.getById(msg.user_id);
  const notifications = buyer.serialize({ notification: true }).notifications;
  if (buyer.get('reg_token') && getNotification(notifications, NotificationType.PRIVATE_MESSAGE)) {
    Notification.send(
      buyerNotification.MESSAGE,
      buyer.get('reg_token'),
      req.marketplace,
      { message_id: String(req.params.id), click_action: `message-detail?id=${req.params.id}` },
    );
  }
  const user = {
    id: req.user.id,
    name: req.user.name,
    photo: req.user.photo,
  };
  req.resData = {
    data: {
      ...detailMessage.serialize(),
      user,
      store: store.serialize({ message: true }),
    },
  };
  return next();
};

/**
 * Get page
 */
StoreController.getPage = async (req, res, next) => {
  const storeId = await Store.getStoreId(req.user.id);
  const [newOrders, processing, sale, disputes] = await Promise.all([
    Invoice.getCount(storeId, InvoiceTransactionStatus.WAITING),
    Invoice.getCount(storeId, InvoiceTransactionStatus.PROCEED),
    Invoice.getCount(storeId),
    Dispute.getMessagesCount({ id_toko: storeId }, req.user.id),
  ]);

  req.resData = {
    message: 'Store Page',
    data: {
      sales: {
        new_order: newOrders,
        processing_order: processing,
        sale,
      },
      disputes,
    },
  };
  return next();
};
