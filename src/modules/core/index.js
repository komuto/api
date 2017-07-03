import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import cache from './cache';
import config from './../../../config';

const imageProduct = file => `${config.imageUrl}/produk/${file}`;

export default { utils, controller, middleware, postgres, routes, cache, imageProduct };
