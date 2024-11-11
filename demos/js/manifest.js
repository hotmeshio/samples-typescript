const Redis = require('redis');
/**
 * The js demo apps can't refer to the db list in manifest.ts,
 * so this provides config in a format usable for the
 * javascript test environment. In this case, always
 * load all database variants, so they're available for the demo.
 */
const USE_DRAGONFLY = true;
const USE_REDIS = true;
const USE_VALKEY = true;

const dbs = {
  redis: {
    name: 'Redis',
    label: 'redis/redis-stack7.2.0',
    search: true,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@redis:6379'
      }
    },
  },
  valkey: {
    name: 'ValKey',
    label: 'ValKey',
    search: false,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@valkey:6379'
      }
    },
  },
  dragonfly: {
    name: 'Dragonfly',
    label: 'DragonflyDB',
    search: true,
    connection: {
      class: Redis,
      options: {
        url: 'redis://:key_admin@dragonflydb:6379'
      }
    }
  }
};

module.exports = {
  dbs
};
