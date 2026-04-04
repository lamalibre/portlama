import { readFile, writeFile, rename, open, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { checkAccess } from '../../lib/authz.js';
import { DEFAULT_DATA_DIR, SETTINGS_FILE, ACCESS_LOG_FILE } from '../../lib/constants.js';
import type { GatekeeperSettings, AccessRequestEntry } from '../../lib/types.js';

const dataDir = process.env.PORTLAMA_DATA_DIR ?? DEFAULT_DATA_DIR;
const settingsPath = path.join(dataDir, SETTINGS_FILE);
const accessLogPath = path.join(dataDir, ACCESS_LOG_FILE);

// Promise-chain mutex for access log writes
let logLock = Promise.resolve();

function withLogLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = logLock;
  let resolve: () => void;
  logLock = new Promise<void>((r) => {
    resolve = r;
  });
  return prev.then(fn).finally(() => resolve!());
}

const UpdateSettingsSchema = z.object({
  adminEmail: z.string().email().max(200).optional(),
  adminName: z.string().max(200).optional(),
  slackChannel: z.string().max(200).optional(),
  teamsChannel: z.string().max(200).optional(),
  sessionCacheTtlMs: z.number().int().min(1000).max(300000).optional(),
  accessLoggingEnabled: z.boolean().optional(),
  accessLogRetentionDays: z.number().int().min(1).max(365).optional(),
});

// ---------------------------------------------------------------------------
// Access log I/O
// ---------------------------------------------------------------------------

async function loadAccessLog(): Promise<AccessRequestEntry[]> {
  try {
    const raw = await readFile(accessLogPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AccessRequestEntry[]) : [];
  } catch {
    return [];
  }
}

async function saveAccessLog(entries: AccessRequestEntry[]): Promise<void> {
  await mkdir(path.dirname(accessLogPath), { recursive: true });
  const tmpPath = `${accessLogPath}.tmp`;
  const content = JSON.stringify(entries, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, accessLogPath);
}

// ---------------------------------------------------------------------------
// Settings I/O
// ---------------------------------------------------------------------------

async function saveSettings(settings: GatekeeperSettings): Promise<void> {
  await mkdir(path.dirname(settingsPath), { recursive: true });
  const tmpPath = `${settingsPath}.tmp`;
  const content = JSON.stringify(settings, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, settingsPath);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function diagnosticRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/access/check — test access for a user
  fastify.get('/access/check', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | undefined>;
    const username = query.username;
    const resourceType = query.resourceType;
    const resourceId = query.resourceId;

    if (!username || !resourceType || !resourceId) {
      return reply.code(400).send({
        error: 'Missing required query params: username, resourceType, resourceId',
      });
    }

    try {
      const result = await checkAccess(username, resourceType, resourceId);
      return result;
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // POST /api/cache/bust — invalidate all cached auth decisions
  fastify.post('/cache/bust', async (_request: FastifyRequest, reply: FastifyReply) => {
    fastify.bustCache();
    return { ok: true };
  });

  // GET /api/settings — get gatekeeper settings
  fastify.get('/settings', async (_request: FastifyRequest, _reply: FastifyReply) => {
    return { settings: fastify.getSettings() };
  });

  // PATCH /api/settings — update gatekeeper settings
  fastify.patch('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    let body: z.infer<typeof UpdateSettingsSchema>;
    try {
      body = UpdateSettingsSchema.parse(request.body);
    } catch (err) {
      return reply.code(400).send({ error: 'Invalid request body', details: (err as z.ZodError).errors });
    }

    try {
      const current = fastify.getSettings();
      const updated: GatekeeperSettings = { ...current, ...body };
      await saveSettings(updated);
      fastify.updateSettings(updated);
      return { ok: true, settings: updated };
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // GET /api/access-log — get access request log
  fastify.get('/access-log', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | undefined>;
    const limit = Math.min(Number(query.limit) || 100, 1000);
    const offset = Number(query.offset) || 0;

    try {
      const entries = await loadAccessLog();
      // Return newest first (toReversed avoids mutating the source array)
      const sorted = [...entries].reverse();
      const page = sorted.slice(offset, offset + limit);
      return { entries: page, total: sorted.length };
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });

  // DELETE /api/access-log — clear access request log
  fastify.delete('/access-log', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      await saveAccessLog([]);
      return { ok: true };
    } catch (err) {
      return reply.code(500).send({ error: (err as Error).message });
    }
  });
}

/**
 * Log a denied access request (called from authz route).
 */
export async function logAccessRequest(entry: AccessRequestEntry): Promise<void> {
  return withLogLock(async () => {
    const entries = await loadAccessLog();
    entries.push(entry);

    // Cap at 10000 entries
    while (entries.length > 10000) {
      entries.shift();
    }

    await saveAccessLog(entries);
  });
}
