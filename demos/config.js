const { dbs } = require('./manifest');

const getProviderConfig = (target = process.env.DEMO_DB || 'redis') => {
  const db = dbs[target] ?? dbs.redis;
  return db.connection;
};

module.exports = {
  getProviderConfig
};
