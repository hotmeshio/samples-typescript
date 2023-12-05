// config/index.ts

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  REDIS_DATABASE: 0,
  REDIS_PORT: 6371,
  REDIS_HOST: 'redis6371',
  REDIS_PASSWORD: 'key_admin',

  // used in Redis as the key prefix
  namespace: 'test',
};

const envConfig = {
  development: require('./development').default,
  test: require('./test').default,
  staging: require('./staging').default,
  production: require('./production').default,
};

export default { ...baseConfig, ...envConfig[env] };
