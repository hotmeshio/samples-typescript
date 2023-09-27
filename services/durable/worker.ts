import { Durable } from '@hotmeshio/hotmesh';
import Redis from 'ioredis'; //OR `import * as Redis from 'redis';`

import config from '../../config';

async function initDurableWorker(workflowName = 'helloworld') {
  const connection = await Durable.NativeConnection.connect({
    class: Redis,
    options: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DATABASE,
    },
  });
  const worker = await Durable.Worker.create({
    connection,
    namespace: 'default',
    taskQueue: workflowName,
    workflowsPath: require.resolve(`./${workflowName}/workflows`),
    activities: await import(`./${workflowName}/activities`),
  });
  await worker.run();
}

export default initDurableWorker;
