import 'dotenv/config'
import fastify from 'fastify';
import { Durable } from '@hotmeshio/hotmesh';

import { setupTelemetry } from '../services/tracer'
import { registerTestRoutes } from './routes/test';
import { MyHowdyClass } from '../services/meshos/howdy';
import { MySleepyClass } from '../services/meshos/sleepy';
import { MyFamilyClass } from '../services/meshos/family';
import { MyLoopyClass } from '../services/meshos/loopy';
import { OrderInventory } from '../services/meshos/inventory';
import { MySignalClass } from '../services/meshos/signal';
import { MyRetryClass } from '../services/meshos/retry';

const start = async (port: number) => {
  // setup open telemetry (sink/export to honeycomb...see README.md)
  setupTelemetry();

  // init Fastify http server
  const server = fastify({ logger: true });
  
  // register test route (/apis/v1/test/:workflowName)
  registerTestRoutes(server);

  // start the workers
  await MyHowdyClass.startWorkers();
  await MySleepyClass.startWorkers();
  await MyLoopyClass.startWorkers();
  await MyFamilyClass.startWorkers();
  await MySignalClass.startWorkers();
  await MyRetryClass.startWorkers();

  //order inventory has a FT search index
  //(find orders by quantity and status)
  await OrderInventory.startWorkers();
  await OrderInventory.createIndex();

  // start fastify
  try {
    await server.listen({ port, path: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);

    async function shutdown() {
      server.close(async () => {
        await Durable.Client.shutdown();
        await Durable.Worker.shutdown();
        process.exit(0);
      });
    }

    // quit on ctrl-c when running docker in terminal
    process.on('SIGINT', async function onSigint() {
      console.log('Got SIGINT (aka ctrl-c in docker). Graceful shutdown', { loggedAt: new Date().toISOString() });
      await shutdown();
    });

    // quit properly on docker stop
    process.on('SIGTERM', async function onSigterm() {
      console.log('Got SIGTERM (docker container stop). Graceful shutdown', { loggedAt: new Date().toISOString() });
      await shutdown();
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

//use port in docker-compose if available
start(Number(process.env.PORT || 3002));
