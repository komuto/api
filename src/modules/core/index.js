import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import * as apiCache from './cache';
import config from '../../../config';

const imagePath = (path, file) => `${config.imageUrl}/${path}/${file}`;
const cache = apiCache.cache;
const cacheClear = apiCache.cacheClear;

export default { utils, controller, middleware, postgres, routes, cache, cacheClear, imagePath };
