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
        //create a new inventory record (seed with '1' item)
        const orderInventory = new OrderInventory(`ord_${HotMesh.guid()}`);
        const handle = await orderInventory.create(1) as unknown as WorkflowHandleService;

        //wait until the inventory is available and then decrement 1 unit
        //by calling the 'incrQuantity' hook method
        let count: number;
        do {
          [count] = await OrderInventory.findWhere(
            { query: [
                { field: 'status', is: '=', value: 'available' }
              ],
              count: true
            }) as unknown as [number];
          await new Promise((resolve) => setTimeout(resolve, 100));
        } while (count as number === 0);

        //wait for the receipt from the `incrQuantity` hook method;
        //the receipt is an x-stream message ID and guarantees that
        //the hook method will complete (but it does not guarantee WHEN)
        const receipt = await orderInventory.incrQuantity(-1);

        //wait until the inventory is depleted. NOTE: This is only
        // placed in a loop, since the `incrQuantity` method above
        // is a 'hook' method and does not guarantee WHEN, only
        // that the method will succeed. In reality, the `incrQuantity` call
        // is near-instantanious and the hook will have completed by this point.
        do {
          [count] = await OrderInventory.findWhere(
            { query: [
                { field: 'status', is: '=', value: 'depleted' }
              ],
              count: true
            }) as unknown as [number];
          await new Promise((resolve) => setTimeout(resolve, 100));
        } while (count as number === 0);

        //the 'create' function waits for the 'depleted' signal; when it awakens,
        //it will return its result (which should be {status: 'depleted'}) and
        //it will likewise self-delete as the 'create' method will have returned
        //its result. (workflows self-delete when they conclude.)
        return reply.code(200).send({ response: await handle.result(), receipt });
      }
      return reply.code(200).send({ response: `${workflowName} is unsupported` });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
};
