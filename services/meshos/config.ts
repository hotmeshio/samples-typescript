import Redis from 'ioredis';
import { MeshOS } from '@hotmeshio/pluck';

import config from '../../config';

export class MeshOSConfig extends MeshOS {

  //every subclass is isolated in Redis by this
  namespace = 'staging';

  redisClass = Redis;

  redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DATABASE,
  };
}
