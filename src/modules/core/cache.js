import apicache from 'apicache';
import redis from 'redis';
import Promise from 'bluebird';
import config from '../../../config';

const cacheConfig = config.cache;
const redisClient = redis.createClient({
  prefix: config.cache.prefix,
});
export const cache = apicache
  .options({
    redisClient,
    debug: cacheConfig.debug,
    enabled: cacheConfig.enable,
    defaultDuration: cacheConfig.duration,
  })
  .middleware;

export const cacheClear = async (key = null) => {
  apicache.clear();

  const redisKeys = [];
  if (!key) {
    redisClient.keys('komuto-api*', async (err, rows) => {
      for (let i = 0, j = rows.length; i < j; ++i) {
        redisKeys.push(rows[i]);
      }
      await Promise.all(redisKeys.map(async (key) => {
        key = key.replace(config.cache.prefix, '');
        await redisClient.del(key);
      }));
    });
  } else {
    redisClient.del(key);
  }
};
export default { cache, cacheClear };
