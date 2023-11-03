import { Durable } from '@hotmeshio/hotmesh';
import Redis from 'ioredis';

import config from '../../config';

async function sendSignal(signalId: string) {
  const client = new Durable.Client({
    connection: {
      class: Redis,
      options: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        db: config.REDIS_DATABASE,
      },
    },
  });
  const payload = {
    signal_id: signalId,
    date: new Date().toISOString(),
  };
  return await client.workflow.signal(signalId, payload);
}

export default sendSignal;
