import 'dotenv/config'
import fastify from 'fastify';

import { setupTelemetry } from '../services/tracer'
import { registerTestRoutes } from './routes/test';
import initDurableWorker from '../services/durable/worker';

const start = async (port: number) => {
  // setup open telemetry (sink/export to honeycomb)
  setupTelemetry();

  // init Fastify http server
  const server = fastify({ logger: true });
  
  // register test route (/apis/v1/test/:workflowName)
  registerTestRoutes(server);

  //7) start the workers
  await initDurableWorker('helloworld');
  await initDurableWorker('child');
  await initDurableWorker('parent');
  await initDurableWorker('looper');

  //8) start fastify on the port configured in the docker-compose.yml file
  try {
    await server.listen({ port, path: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);

    async function shutdown() {
      server.close(async () => {
        //todo exit psdb gracefull
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

start(3002);
