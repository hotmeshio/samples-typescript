import 'dotenv/config'
import fastify from 'fastify';

import { setupTelemetry } from '../services/tracer'
import { User } from '../services/pluck/user';
import { registerUserRoutes } from './routes/user';
import { Bill, Pluck } from '../services/pluck/bill';
import { registerBillRoutes } from './routes/bill';

const start = async (port: number) => {
  // setup open telemetry (sink/export to honeycomb...see README.md)
  setupTelemetry();

  // init Fastify http server
  const server = fastify({ logger: true });
  
  // register test route (/apis/v1/test/:workflowName)
  registerUserRoutes(server);
  registerBillRoutes(server);

  // register Pluck entities (operational data layer)
  await User.connect();
  await User.index();
  await Bill.connect();
  await Bill.index();

  // start fastify
  try {
    await server.listen({ port, path: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);

    async function shutdown() {
      server.close(async () => {
        await Pluck.shutdown();  
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
