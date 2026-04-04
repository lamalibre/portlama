import crypto from 'node:crypto';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { request as undiciRequest } from 'undici';
import { AUTHELIA_VERIFY_URL, SESSION_CACHE_TTL_MS } from '../../lib/constants.js';
import { checkAccess } from '../../lib/authz.js';
import { buildAccessRequestPage } from '../../lib/templates.js';
import { logAccessRequest } from '../routes/diagnostic.js';
import type { AutheliaSession, TunnelInfo } from '../../lib/types.js';

/** Hard cap on session cache entries to prevent memory exhaustion on 512MB droplets. */
const MAX_SESSION_CACHE_ENTRIES = 10_000;

/**
 * Extract the Authelia session cookie value from the full cookie header.
 * Returns the value or the full cookie string as fallback.
 */
function extractAutheliaCookie(cookie: string): string {
  const match = cookie.match(/(?:^|;\s*)authelia_session=([^;]*)/);
  return match?.[1] ?? cookie;
}

/**
 * Hash a cookie string for use as session cache key.
 * Uses SHA-256 to avoid storing raw cookie values in memory.
 */
function hashCookie(cookie: string): string {
  return crypto.createHash('sha256').update(cookie).digest('hex');
}

/**
 * Forward the request's cookies to Authelia's verify endpoint
 * and extract the identity headers from the response.
 */
async function validateWithAuthelia(
  cookie: string,
  originalUrl: string,
): Promise<AutheliaSession | null> {
  try {
    const { statusCode, headers } = await undiciRequest(AUTHELIA_VERIFY_URL, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
        'X-Original-URL': originalUrl,
        'X-Forwarded-For': '127.0.0.1',
      },
    });

    if (statusCode !== 200) {
      return null;
    }

    const username = getHeader(headers, 'remote-user');
    if (!username) return null;

    return {
      username,
      groups: getHeader(headers, 'remote-groups') ?? '',
      displayName: getHeader(headers, 'remote-name') ?? '',
      email: getHeader(headers, 'remote-email') ?? '',
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    };
  } catch {
    return null;
  }
}

function getHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const val = headers[name];
  if (Array.isArray(val)) return val[0];
  return val;
}

/**
 * Look up a tunnel by its FQDN from the in-memory cache.
 */
function findTunnelByFqdn(
  tunnels: readonly TunnelInfo[],
  fqdn: string,
): TunnelInfo | undefined {
  return tunnels.find((t) => t.fqdn === fqdn);
}

/**
 * Extract hostname from an X-Original-URL header value.
 */
function extractHostname(originalUrl: string): string {
  try {
    return new URL(originalUrl).hostname;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Route plugin
// ---------------------------------------------------------------------------

export async function authzRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /authz/check — nginx auth_request target
   *
   * Flow:
   * 1. Read Cookie and X-Original-URL from nginx
   * 2. Validate Authelia session (cached in memory)
   * 3. Look up tunnel by hostname
   * 4. Check access mode and grants
   * 5. Return 200 (allowed), 401 (not authenticated), or 403 (not authorized)
   *
   * On 403, the response body is the full access-request HTML page
   * (nginx serves this inline on the tunnel's FQDN via error_page 403 =).
   */
  fastify.get('/authz/check', async (request: FastifyRequest, reply: FastifyReply) => {
    const cookie = request.headers['cookie'] ?? '';
    const originalUrl = (request.headers['x-original-url'] as string) ?? '';

    if (!cookie || !originalUrl) {
      return reply.code(401).send();
    }

    // Check session cache (keyed by Authelia session cookie only to prevent
    // cache pollution via unrelated cookies like CSRF tokens or analytics)
    const cacheKey = hashCookie(extractAutheliaCookie(cookie));
    const sessionCache = fastify.getSessionCache();
    let session = sessionCache.get(cacheKey);

    if (!session || session.expiresAt <= Date.now()) {
      // Cache miss or expired — validate with Authelia
      session = await validateWithAuthelia(cookie, originalUrl) ?? undefined;

      if (!session) {
        return reply.code(401).send();
      }

      sessionCache.set(cacheKey, session);

      // Evict stale entries periodically (every 100 sets) or when cap is reached
      if (sessionCache.size % 100 === 0 || sessionCache.size > MAX_SESSION_CACHE_ENTRIES) {
        const now = Date.now();
        for (const [key, val] of sessionCache) {
          if (val.expiresAt <= now) sessionCache.delete(key);
        }
        // If still over cap after TTL eviction, clear entirely (DoS protection)
        if (sessionCache.size > MAX_SESSION_CACHE_ENTRIES) {
          sessionCache.clear();
        }
      }
    }

    // Look up tunnel
    const hostname = extractHostname(originalUrl);
    const tunnel = findTunnelByFqdn(fastify.getTunnels(), hostname);

    if (!tunnel) {
      // Fail closed: unknown tunnel or empty cache → deny access.
      // This prevents bypass when tunnelsCache is temporarily empty
      // (file watcher race, corruption, or missing X-Original-URL).
      return reply.code(403).type('text/html; charset=utf-8').send(
        buildAccessRequestPage(
          session.username,
          hostname || 'unknown',
          {
            adminContact: fastify.getSettings().adminEmail,
            adminName: fastify.getSettings().adminName,
          },
        ),
      );
    }

    // Check access mode
    if (tunnel.accessMode === 'public' || tunnel.accessMode === 'authenticated') {
      setAutheliaHeaders(reply, session);
      return reply.code(200).send();
    }

    // restricted — check grants
    const result = await checkAccess(
      session.username,
      'tunnel',
      tunnel.id,
      {
        adminContact: fastify.getSettings().adminEmail,
        adminName: fastify.getSettings().adminName,
      },
    );

    if (result.allowed) {
      setAutheliaHeaders(reply, session);
      return reply.code(200).send();
    }

    // Log the denied access attempt (fire-and-forget — don't block the response)
    if (fastify.getSettings().accessLoggingEnabled) {
      logAccessRequest({
        timestamp: new Date().toISOString(),
        username: session.username,
        resourceType: 'tunnel',
        resourceId: tunnel.id,
        resourceFqdn: hostname,
      }).catch(() => { /* non-fatal */ });
    }

    // Access denied — return inline HTML page as 403 body
    const html = buildAccessRequestPage(
      session.username,
      hostname,
      {
        adminContact: fastify.getSettings().adminEmail,
        adminName: fastify.getSettings().adminName,
      },
    );

    return reply
      .code(403)
      .type('text/html; charset=utf-8')
      .send(html);
  });
}

/**
 * Set Authelia identity headers on the response so nginx can
 * forward them to the tunnel backend.
 */
function setAutheliaHeaders(reply: FastifyReply, session: AutheliaSession): void {
  reply.header('remote-user', session.username);
  reply.header('remote-groups', session.groups);
  reply.header('remote-name', session.displayName);
  reply.header('remote-email', session.email);
}
