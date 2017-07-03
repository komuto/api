import apicache from 'apicache';
import redis from 'redis';
import config from '../../../config';

const cacheConfig = config.cache;
const cache = apicache
  .options({
    debug: cacheConfig.debug,
    redisClient: redis.createClient(),
    enabled: cacheConfig.enable,
    defaultDuration: cacheConfig.duration,
  })
  .middleware;
export default cache;
