import apicache from 'apicache';
import redis from 'redis';
import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';
import config from './../../../config';

const cache = apicache
  .options({ redisClient: redis.createClient() })
  .middleware;

const imageProduct = file => `${config.imageUrl}/produk/${file}`;

export default { utils, controller, middleware, postgres, routes, cache, imageProduct };
