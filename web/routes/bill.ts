import { FastifyInstance } from 'fastify';
import { Body, Params, Query } from '../../types/http';
import { Bill } from '../../services/pluck/bill';

export const registerBillRoutes = (server: FastifyInstance) => {

  //retrieve
  server.get<{ Params: Params; QueryString: Query }>(`/apis/v1/bills/:id`, async (request, reply) => {
    try {
      const { id } = request.params;
      return Bill.pluck.get(Bill.entity, id, { fields: Bill.fields });
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //find/search
  server.post<{ Params: Params; QueryString: Query, Body: Body }>(`/apis/v1/bills/SEARCH`, async (request, reply) => {
    try {
      return Bill.find(request.body.query as unknown as { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //find/count
  server.post<{ Params: Params; QueryString: Query, Body: Body }>(`/apis/v1/bills/COUNT`, async (request, reply) => {
    try {
      const count = await Bill.count(request.body.query as unknown as { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]);
      return { count };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //WORKFLOW: reconciling/patch
  server.patch<{ Params: Params; QueryString: Query; Body: Body }>(`/apis/v1/bills/:id/reconciling`, async (request, reply) => {
    try {
      return await Bill.reconcile(request.params.id);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
};
