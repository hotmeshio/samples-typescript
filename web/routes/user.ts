import { FastifyInstance } from 'fastify';
import { Body, Params, Query } from '../../types/http';
import { User } from '../../services/pluck/user';

export const registerUserRoutes = (server: FastifyInstance) => {

  //create
  server.post<{ Params: Params; QueryString: Query; Body: Body }>(`/apis/v1/users`, async (request, reply) => {
    try {
      return await User.create(request.body as Body);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //retrieve
  server.get<{ Params: Params; QueryString: Query }>(`/apis/v1/users/:id`, async (request, reply) => {
    try {
      const { id } = request.params;
      return User.retrieve(id);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //update/patch
  server.patch<{ Params: Params; QueryString: Query; Body: Body }>(`/apis/v1/users/:id`, async (request, reply) => {
    try {
      return await User.update(request.params.id, request.body as Body);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //delete
  server.delete<{ Params: Params; QueryString: Query; }>(`/apis/v1/users/:id`, async (request, reply) => {
    try {
      const deleted = await User.delete(request.params.id);
      return { deleted };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //find/search
  server.post<{ Params: Params; QueryString: Query, Body: Body }>(`/apis/v1/users/SEARCH`, async (request, reply) => {
    try {
      return User.find(request.body.query as unknown as { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //find/count
  server.post<{ Params: Params; QueryString: Query, Body: Body }>(`/apis/v1/users/COUNT`, async (request, reply) => {
    try {
      const count = await User.count(request.body.query as unknown as { field: string, is: '=' | '[]' | '>=' | '<=', value: string}[]);
      return { count };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  //WORKFLOW: billing/patch
  server.patch<{ Params: Params; QueryString: Query; Body: Body }>(`/apis/v1/users/:id/billing`, async (request, reply) => {
    try {
      return await User.bill(request.params.id, request.body as Body);
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });
};
