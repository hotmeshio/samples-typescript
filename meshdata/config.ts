import { databases } from '../web/utils/meshos';

/**
 * Get the Redis configuration for the target database.
 * Override with process.env.DEMO_DB
 */
export const getProviderConfig = (target = process.env.DEMO_DB || 'redis') => {
  const db = databases[target] ?? databases.redis;
  return db.connection;
};
