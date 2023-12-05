import Redis from 'ioredis';
import { MeshOS } from '@hotmeshio/hotmesh';

import config from '../../config';

export class MeshOSConfig extends MeshOS {

  redisClass = Redis;

  redisOptions = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DATABASE,
  };
}
  