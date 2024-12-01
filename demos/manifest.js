const Redis = require('redis');
const { Pool } = require('pg');
const { connect:NATS } = require('nats');

/**
 * The js demo apps can't refer to the db list in manifest.ts,
 * so this provides config in a format usable for the
 * javascript test environment. In this case, always
 * load all database variants, so they're available for the demo.
 */

const PostgresPoolClient = new Pool({
  connectionString: 'postgresql://postgres:password@postgres:5432/hotmesh'
});

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
  postgres: {
    name: 'Postgres',
    label: 'postgres:latest',
    search: false,
    connection: {
      store: {
        class: PostgresPoolClient,
        options: {}
      },
      stream: {
        class: PostgresPoolClient,
        options: {}
      },
      sub: {
        class: NATS,
        options: { servers: ['nats:4222'] }
      },
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
