import apicache from 'apicache';
import redis from 'redis';
import './initialize';
import * as utils from './utils';
import * as middleware from './middleware';
import controller from './controller';
import postgres from './knex';
import routes from './routes';

const cache = apicache
  .options({ redisClient: redis.createClient() })
  .middleware;

export default { utils, controller, middleware, postgres, routes, cache };
