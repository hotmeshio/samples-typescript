import { FastifyInstance } from 'fastify';
import { Params, Query } from '../../types/http';
import { MyHowdyClass } from '../../services/meshos/howdy';
import { HotMesh } from '@hotmeshio/hotmesh';
import { MySleepyClass } from '../../services/meshos/sleepy';
import { MyFamilyClass } from '../../services/meshos/family';
import { MyLoopyClass } from '../../services/meshos/loopy';
import { OrderInventory } from '../../services/meshos/inventory';
import { WorkflowHandleService } from '@hotmeshio/hotmesh/build/services/durable/handle';
import { MySignalClass } from '../../services/meshos/signal';
import { MyRetryClass } from '../../services/meshos/retry';

export const registerTestRoutes = (server: FastifyInstance) => {
  server.get<{ Params: Params; QueryString: Query }>(`/apis/v1/test/:workflowName`, async (request, reply) => {
    try {
      let { workflowName } = request.params;
      //start workflows via GET http://localhost:3002/apis/v1/test/:workflowName
      if (workflowName === 'howdy') {
        const howdyWorkflow = new MyHowdyClass(HotMesh.guid(), { await: true });
        const response = await howdyWorkflow.ciao('world');
        return reply.code(200).send({ response });
      } else if (workflowName === 'sleepy') {
        //this test sleeps/runs for 21 seconds
        const sleepyFlow = new MySleepyClass(HotMesh.guid(), { await: true });
        const response = await sleepyFlow.sleep('world');
        return reply.code(200).send({ response });
      } else if (workflowName === 'family') {
        const familyFlow = new MyFamilyClass(HotMesh.guid(), { await: true });
        const response = await familyFlow.parentWorkflow('world');
        return reply.code(200).send({ response });
      } else if (workflowName === 'loopy') {
        const loopyFlow = new MyLoopyClass(HotMesh.guid(), { await: true });
        const response = await loopyFlow.loop(5);
        return reply.code(200).send({ response });
      } else if (workflowName === 'signal') {
        const sigFlow = new MySignalClass(HotMesh.guid(), { await: true });
        const response = await sigFlow.signal('fred');
        return reply.code(200).send({ response });
      } else if (workflowName === 'retry') {
        const retryFlow = new MyRetryClass(HotMesh.guid(), { await: true });
        const response = await retryFlow.retryMe('janice');
        return reply.code(200).send({ response });
      } else if (workflowName === 'inventory') {
        //this test 'runs' for 11 seconds. During that time,
        //it can be updated by other methods (e.g. incrQuantity)
        const orderInventory = new OrderInventory(`ord_${HotMesh.guid()}`);
        const handle = await orderInventory.create(1) as unknown as WorkflowHandleService;
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        //decrement quantity
        await orderInventory.incrQuantity(-1);
        return reply.code(200).send({ response: await handle.result() });
      }
      return reply.code(200).send({ response: `${workflowName} is unsupported` });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
};
