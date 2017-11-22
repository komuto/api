import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import * as apiCache from './cache';
import config from '../../../config';
import { email } from './email';
import { Notification, buyerNotification, sellerNotification } from './notification';

const imagePath = (path, file, parent = null) => {
  if (!file) return null;
  return `${config.assetUrl}/assets${parent ? `/${parent}` : ''}/${path}/${file}`;
};
const categoryPath = (domain, file, path) => `https://${domain}/assets/images/img-kategori/${path}/${file}`;
const expeditionPath = (domain, file) => `https://${domain}/assets/img/pengiriman/${file}`;
const cache = apiCache.cache;
const cacheClear = apiCache.cacheClear;

export default {
  utils,
  email,
  controller,
  middleware,
  postgres,
  routes,
  cache,
  cacheClear,
  imagePath,
  categoryPath,
  expeditionPath,
  Notification,
  buyerNotification,
  sellerNotification,
};
