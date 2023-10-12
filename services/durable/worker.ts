import { Durable } from '@hotmeshio/hotmesh';
import Redis from 'ioredis'; //OR `import * as Redis from 'redis';`

import config from '../../config';

async function initDurableWorker(workflowName = 'helloworld') {
  const worker = await Durable.Worker.create({
    connection: {
      class: Redis,
      options: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        db: config.REDIS_DATABASE,
      },
    },
    taskQueue: workflowName,
    workflow: await import(`./${workflowName}/workflows`),
  });
  await worker.run();
}

export default initDurableWorker;
