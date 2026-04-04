import crypto from 'node:crypto';
import Fastify from 'fastify';
import { watch } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DATA_DIR,
  GROUPS_FILE,
  GRANTS_FILE,
  SETTINGS_FILE,
  GATEKEEPER_PORT,
  SESSION_CACHE_TTL_MS,
} from '../lib/constants.js';
import type { TunnelInfo, GatekeeperSettings, AutheliaSession } from '../lib/types.js';
import { authzRoutes } from './routes/authz.js';
import { groupRoutes } from './routes/groups.js';
import { grantRoutes } from './routes/grants.js';
import { diagnosticRoutes } from './routes/diagnostic.js';
import { accessRequestRoutes } from './routes/access-request.js';

const dataDir = process.env.PORTLAMA_DATA_DIR ?? DEFAULT_DATA_DIR;
const tunnelsPath = path.join(dataDir, 'tunnels.json');
const settingsPath = path.join(dataDir, SETTINGS_FILE);

// ---------------------------------------------------------------------------
// In-memory caches (refreshed by file watch + TTL)
// ---------------------------------------------------------------------------

/** Tunnel info cache (refreshed on file change) */
let tunnelsCache: TunnelInfo[] = [];

/** Gatekeeper settings cache */
let settingsCache: GatekeeperSettings = {};

/** Authelia session cache: cookie hash → session data */
const sessionCache = new Map<string, AutheliaSession>();

/** Cache version counter — incremented on cache bust */
let cacheVersion = 0;

// ---------------------------------------------------------------------------
// File loaders
// ---------------------------------------------------------------------------

async function loadTunnels(): Promise<TunnelInfo[]> {
  try {
    const raw = await readFile(tunnelsPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((t: Record<string, unknown>) => ({
      id: String(t.id ?? ''),
      fqdn: String(t.fqdn ?? ''),
      accessMode: (t.accessMode as TunnelInfo['accessMode']) ?? 'restricted',
      enabled: t.enabled !== false,
    }));
  } catch {
    return [];
  }
}

async function loadSettings(): Promise<GatekeeperSettings> {
  try {
    const raw = await readFile(settingsPath, 'utf-8');
    return JSON.parse(raw) as GatekeeperSettings;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// File watcher with debounce
// ---------------------------------------------------------------------------

function watchFile(filePath: string, reload: () => Promise<void>, logger: { info: (msg: string) => void }): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    watch(filePath, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reload().catch(() => {
          // Reload errors are non-fatal — keep using cached data
        });
        logger.info(`Reloaded ${path.basename(filePath)}`);
      }, 200);
    });
  } catch {
    // File may not exist yet — that's fine, will be created later
  }
}

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------

export async function createServer(): Promise<ReturnType<typeof Fastify>> {
  const server = Fastify({
    logger: true,
    trustProxy: 1,
  });

  // Load initial state
  tunnelsCache = await loadTunnels();
  settingsCache = await loadSettings();

  // Decorate server with shared state accessors
  server.decorate('getTunnels', () => tunnelsCache);
  server.decorate('getSettings', () => settingsCache);
  server.decorate('getSessionCache', () => sessionCache);
  server.decorate('getCacheVersion', () => cacheVersion);
  server.decorate('bustCache', () => {
    cacheVersion++;
    sessionCache.clear();
  });
  server.decorate('updateSettings', (s: GatekeeperSettings) => {
    settingsCache = s;
  });

  // Watch state files for changes
  watchFile(tunnelsPath, async () => {
    tunnelsCache = await loadTunnels();
  }, server.log);

  watchFile(path.join(dataDir, GROUPS_FILE), async () => {
    // Groups are read from disk by library functions on each call,
    // but clearing session cache ensures authz re-evaluates group membership
    sessionCache.clear();
  }, server.log);

  watchFile(path.join(dataDir, GRANTS_FILE), async () => {
    // Same — clear session cache so authz picks up grant changes
    sessionCache.clear();
  }, server.log);

  watchFile(settingsPath, async () => {
    settingsCache = await loadSettings();
  }, server.log);

  // Load or generate API secret for localhost management auth
  const secretPath = path.join(dataDir, 'gatekeeper-secret');
  let apiSecret: string;
  try {
    apiSecret = (await readFile(secretPath, 'utf-8')).trim();
  } catch {
    apiSecret = crypto.randomBytes(32).toString('hex');
    await writeFile(secretPath, apiSecret + '\n', { encoding: 'utf-8', mode: 0o600 });
    server.log.info('Generated new gatekeeper API secret');
  }

  // Register routes — authz, access-request, and health are public (nginx subrequests)
  await server.register(authzRoutes);
  await server.register(accessRequestRoutes);

  // Management /api/* routes require the shared secret
  await server.register(async (scope) => {
    scope.addHook('onRequest', async (request, reply) => {
      const auth = request.headers['x-gatekeeper-secret'];
      if (auth !== apiSecret) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
    });
    await scope.register(groupRoutes, { prefix: '/api' });
    await scope.register(grantRoutes, { prefix: '/api' });
    await scope.register(diagnosticRoutes, { prefix: '/api' });
  });

  // Health endpoint
  server.get('/health', async () => ({ status: 'ok' }));

  return server;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  const server = await createServer();

  await server.listen({
    host: '127.0.0.1',
    port: GATEKEEPER_PORT,
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    server.log.info({ signal }, 'Received signal, shutting down gracefully');
    await server.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start gatekeeper:', err);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Fastify type augmentation
// ---------------------------------------------------------------------------

declare module 'fastify' {
  interface FastifyInstance {
    getTunnels(): TunnelInfo[];
    getSettings(): GatekeeperSettings;
    getSessionCache(): Map<string, AutheliaSession>;
    getCacheVersion(): number;
    bustCache(): void;
    updateSettings(s: GatekeeperSettings): void;
  }
}
