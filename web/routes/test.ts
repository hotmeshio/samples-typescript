import { FastifyInstance } from 'fastify';
import { Params, Query } from '../../types/http';
import executeDurableWorkflow from '../../services/durable/client';
import sendSignal from '../../services/durable/signal';

export const registerTestRoutes = (server: FastifyInstance) => {
  server.get<{ Params: Params; QueryString: Query }>(`/apis/v1/test/:workflowName`, async (request, reply) => {
    try {
      let { workflowName } = request.params;
      //start workflows via GET http://localhost:3002/apis/v1/test/:workflowName
      if (!['parent', 'child', 'helloworld', 'looper', 'remote', 'retry', 'saludar', 'sleep', 'wait'].includes(workflowName)) {
        workflowName = 'helloworld';
      }
      const response = await executeDurableWorkflow(workflowName);
      return reply.code(200).send({ response });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  server.get<{ Params: Params; QueryString: Query }>(`/apis/v1/signal/:topic`, async (request, reply) => {
    try {
      let { topic } = request.params;
      await sendSignal(topic);
      return reply.code(200).send({ signal: topic, sent: true });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
};
