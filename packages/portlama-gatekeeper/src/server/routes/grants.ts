import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createGrant,
  listGrants,
  getGrant,
  revokeGrant,
} from '../../lib/grants.js';
import type { GrantFilter } from '../../lib/types.js';

const CreateGrantSchema = z.object({
  principalType: z.enum(['user', 'group']),
  principalId: z.string().min(1).max(100),
  resourceType: z.string().min(1).max(100),
  resourceId: z.string().min(1).max(500),
  context: z.record(z.unknown()).optional().default({}),
});

export async function grantRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/grants — create grant
  fastify.post('/grants', async (request: FastifyRequest, reply: FastifyReply) => {
    let body: z.infer<typeof CreateGrantSchema>;
    try {
      body = CreateGrantSchema.parse(request.body);
    } catch (err) {
      return reply.code(400).send({ error: 'Invalid request body', details: (err as z.ZodError).errors });
    }

    try {
      const grant = await createGrant(body);
      return reply.code(201).send({ ok: true, grant });
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });

  // GET /api/grants — list grants (with optional query filters)
  fastify.get('/grants', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | undefined>;

    const filter: GrantFilter = {};
    if (query.principalType === 'user' || query.principalType === 'group') {
      (filter as Record<string, unknown>).principalType = query.principalType;
    }
    if (query.principalId) {
      (filter as Record<string, unknown>).principalId = query.principalId;
    }
    if (query.resourceType) {
      (filter as Record<string, unknown>).resourceType = query.resourceType;
    }
    if (query.resourceId) {
      (filter as Record<string, unknown>).resourceId = query.resourceId;
    }
    if (query.used === 'true' || query.used === 'false') {
      (filter as Record<string, unknown>).used = query.used === 'true';
    }

    try {
      const grants = await listGrants(
        Object.keys(filter).length > 0 ? filter : undefined,
      );
      return { grants };
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /api/grants/:grantId — get grant
  fastify.get('/grants/:grantId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { grantId } = request.params as { grantId: string };
    try {
      const grant = await getGrant(grantId);
      if (!grant) {
        return reply.code(404).send({ error: 'Grant not found' });
      }
      return { grant };
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // DELETE /api/grants/:grantId — revoke grant
  fastify.delete('/grants/:grantId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { grantId } = request.params as { grantId: string };
    try {
      const grant = await revokeGrant(grantId);
      return { ok: true, grant };
    } catch (err) {
      const e = err as Error & { statusCode?: number };
      return reply.code(e.statusCode ?? 500).send({ error: e.message });
    }
  });
}
