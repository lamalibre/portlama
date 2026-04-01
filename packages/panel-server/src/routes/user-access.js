import { z } from 'zod';
import { getConfig } from '../lib/config.js';
import { ensureSessionSecret } from '../lib/session.js';
import { createUserSession } from '../lib/user-access-session.js';
import {
  createGrant,
  listGrants,
  revokeGrant,
  listGrantsForUser,
  consumeGrant,
  createOTP,
  validateAndConsumeOTP,
} from '../lib/user-access.js';
import { createEnrollmentToken } from '../lib/enrollment.js';
import { readPlugins } from '../lib/plugins.js';

// --- Zod schemas ---

const CreateGrantSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_-]+$/, 'Invalid username format'),
  pluginName: z
    .string()
    .min(1)
    .max(200)
    .regex(/^@lamalibre\//, 'Plugin must be @lamalibre/ scoped'),
});

const GrantIdParamSchema = z.object({
  grantId: z.string().uuid('Invalid grant ID format'),
});

const ExchangeBodySchema = z.object({
  token: z.string().length(64, 'Invalid token format'),
});

const EnrollBodySchema = z.object({
  grantId: z.string().uuid('Invalid grant ID format'),
});

// --- Admin routes (mTLS + roleGuard) ---

/**
 * Admin grant management routes.
 * Registered inside the protectedContext (mTLS + roleGuard).
 */
export async function userAccessAdminRoutes(fastify, _opts) {
  // GET /api/user-access/grants — list all grants
  fastify.get(
    '/user-access/grants',
    {
      preHandler: fastify.requireRole(['admin']),
    },
    async (request, reply) => {
      try {
        const grants = await listGrants();
        return { grants };
      } catch (err) {
        request.log.error(err, 'Failed to list user access grants');
        return reply.code(500).send({ error: 'Failed to list grants' });
      }
    },
  );

  // POST /api/user-access/grants — create a grant
  fastify.post(
    '/user-access/grants',
    {
      preHandler: fastify.requireRole(['admin']),
    },
    async (request, reply) => {
      let body;
      try {
        body = CreateGrantSchema.parse(request.body);
      } catch (err) {
        return reply.code(400).send({ error: err.errors?.[0]?.message || 'Invalid request body' });
      }

      try {
        const grant = await createGrant(body.username, body.pluginName, request.log);
        return { ok: true, grant };
      } catch (err) {
        request.log.error(err, 'Failed to create user access grant');
        const statusCode = err.statusCode || 500;
        return reply.code(statusCode).send({ error: err.message || 'Failed to create grant' });
      }
    },
  );

  // DELETE /api/user-access/grants/:grantId — revoke an unused grant
  fastify.delete(
    '/user-access/grants/:grantId',
    {
      preHandler: fastify.requireRole(['admin']),
    },
    async (request, reply) => {
      let params;
      try {
        params = GrantIdParamSchema.parse(request.params);
      } catch (err) {
        return reply.code(400).send({ error: err.errors?.[0]?.message || 'Invalid grant ID' });
      }

      try {
        await revokeGrant(params.grantId, request.log);
        return { ok: true };
      } catch (err) {
        const statusCode = err.statusCode || 500;
        return reply.code(statusCode).send({ error: err.message || 'Failed to revoke grant' });
      }
    },
  );
}

// --- Public routes (no mTLS) ---

/**
 * Public user-access routes for the OAuth-like auth flow.
 * Registered in the publicContext (no mTLS required).
 */
export async function userAccessPublicRoutes(fastify, _opts) {
  // GET /authorize — Authelia-protected, generates OTP, redirects to deep link
  fastify.get('/authorize', async (request, reply) => {
    const config = getConfig();

    // Remote-User header is set by nginx after Authelia forward auth succeeds
    const username = request.headers['remote-user'];
    if (!username) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    try {
      const { token } = await createOTP(username, request.log);
      const domain = config.domain;

      if (!domain) {
        return reply.code(503).send({ error: 'Server domain not configured' });
      }

      // Redirect to desktop app deep link
      const callbackUrl = `portlama://callback?token=${encodeURIComponent(token)}&domain=${encodeURIComponent(domain)}`;
      return reply.redirect(302, callbackUrl);
    } catch (err) {
      request.log.error(err, 'Failed to create user access OTP');
      return reply.code(500).send({ error: 'Authorization failed' });
    }
  });

  // POST /exchange — exchange OTP for a user session token
  fastify.post('/exchange', async (request, reply) => {
    let body;
    try {
      body = ExchangeBodySchema.parse(request.body);
    } catch {
      return reply.code(400).send({ error: 'Invalid request' });
    }

    try {
      const { username } = await validateAndConsumeOTP(body.token);
      const sessionSecret = await ensureSessionSecret();
      const session = createUserSession(sessionSecret, username);

      return {
        ok: true,
        sessionToken: session.value,
        username,
        expiresAt: session.expiresAt,
      };
    } catch (err) {
      // Use generic error message (no information leakage)
      const statusCode = err.statusCode || 500;
      return reply.code(statusCode).send({ error: 'Invalid or expired token' });
    }
  });
}

// --- User-session-protected routes ---

/**
 * Routes accessible to authenticated Authelia users via Bearer session token.
 * Registered with user-access-session middleware.
 */
export async function userAccessProtectedRoutes(fastify, _opts) {
  // GET /plugins — list granted plugins for the authenticated user
  fastify.get('/plugins', async (request, reply) => {
    const username = request.userAccessUsername;

    try {
      const grants = await listGrantsForUser(username);

      // Enrich with plugin metadata where available
      let plugins = [];
      try {
        const registry = await readPlugins();
        plugins = registry.plugins || [];
      } catch {
        // Plugin registry may not exist — proceed with grants only
      }

      const pluginMap = new Map();
      for (const p of plugins) {
        pluginMap.set(p.packageName, p);
      }

      const enrichedGrants = grants.map((g) => {
        const plugin = pluginMap.get(g.pluginName);
        return {
          ...g,
          plugin: plugin
            ? {
                name: plugin.name,
                displayName: plugin.displayName || plugin.name,
                description: plugin.description,
                version: plugin.version,
              }
            : null,
        };
      });

      return { grants: enrichedGrants };
    } catch (err) {
      request.log.error(err, 'Failed to list user plugins');
      return reply.code(500).send({ error: 'Failed to list plugins' });
    }
  });

  // POST /enroll — consume a grant and generate an enrollment token
  fastify.post('/enroll', async (request, reply) => {
    const username = request.userAccessUsername;

    let body;
    try {
      body = EnrollBodySchema.parse(request.body);
    } catch {
      return reply.code(400).send({ error: 'Invalid request' });
    }

    try {
      // Consume the grant (validates ownership and single-use)
      const grant = await consumeGrant(body.grantId, username, request.log);

      // Generate an enrollment token for a new agent
      // Label is auto-generated from username + plugin short name.
      // Underscores in usernames are replaced with hyphens to match agent label format
      // (signCSR validates labels against /^[a-z0-9][a-z0-9-]*$/).
      const pluginShortName = grant.pluginName.replace(/^@lamalibre\//, '').replace(/-server$/, '');
      const sanitizedUsername = username.replace(/_/g, '-');
      const label = `${sanitizedUsername}-${pluginShortName}`;

      // Default capabilities for user-enrolled agents
      const capabilities = ['tunnels:read', 'services:read', 'system:read'];

      const tokenData = await createEnrollmentToken(label, capabilities, [], request.log);

      return {
        ok: true,
        enrollmentToken: tokenData.token,
        label: tokenData.label,
        expiresAt: tokenData.expiresAt,
        pluginName: grant.pluginName,
      };
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const message = statusCode < 500 ? err.message : 'Enrollment failed';
      return reply.code(statusCode).send({ error: message });
    }
  });
}
