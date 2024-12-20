//USAGE            `DEMO_DB=valkey npm run demo:ts:meshflow`
//                 `DEMO_DB=dragonfly npm run demo:ts:meshflow`
//                 `DEMO_DB=postgres npm run demo:ts:meshflow`
//                 `npm run demo:ts:meshflow` //default is redis

console.log('initializing meshflow demo ...\n');

import 'dotenv/config';
import { MeshFlow, HotMesh } from '@hotmeshio/hotmesh';
import { getProviderConfig } from '../../../meshdata/config';
import { getTraceUrl, setupTelemetry, shutdownTelemetry } from '../../../modules/tracer';
import * as workflows from './workflows';

setupTelemetry();

(async () => {
  try {
    //1) Initialize the worker; this is typically done in
    //   another file, but is done here for convenience.
    //   The worker will stay open, listening to its
    //   task queue until MeshFlow.shutdown is called.
    await MeshFlow.Worker.create({
      connection: getProviderConfig(),
      taskQueue: 'default',
      namespace: 'meshflow',
      workflow: workflows.example,
      options: {
        backoffCoefficient: 2,
        maximumAttempts: 1_000,
        maximumInterval: '5 seconds'
      }
    });

    //2) initialize the client; this is typically done in
    //   another file, but is done here for convenience
    const client = new MeshFlow.Client({
      connection: getProviderConfig()
    });

    //3) start a new workflow
    const workflowId = `default-${HotMesh.guid()}`;
    const handle = await client.workflow.start({
      namespace: 'meshflow', //the app name in Redis
      taskQueue: 'default',
      workflowName: 'example',
      workflowId,
      args: ['HotMesh', 'es'],
      expire: 3_600,
      search: {
        data: {
          $entity: 'default',
          id: workflowId,
        },
      },
    });

    //4) subscribe to the eventual result
    console.log('\nRESPONSE', await handle.result(), '\n');
    const jobState = await handle.state(true);

    //5) Shutdown (typically on sigint/sigterm)
    await MeshFlow.shutdown();
    await shutdownTelemetry();
    console.log('\n\nTELEMETRY', getTraceUrl(jobState.metadata.trc), '\n');

    process.exit(0);
  } catch (error) {
    console.error('An error occurred:', error);

    // Shutdown and exit with error code
    await MeshFlow.shutdown();
    process.exit(1);
  }
})();
