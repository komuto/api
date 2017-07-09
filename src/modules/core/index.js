import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import * as apiCache from './cache';
import config from '../../../config';
import { email } from './email';

const imagePath = (path, file) => {
  if (!file) return null;
  return `${config.assetUrl}/uploads/${path}/${file}`;
};
const categoryPath = file => `${config.assetUrl}/images/img-kategori/${file}`;
const expeditionPath = file => `${config.assetUrl}/img/pengiriman/${file}`;
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
};
