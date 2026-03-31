import crypto from 'node:crypto';
import { readFile, writeFile, rename, open } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const ConfigSchema = z.object({
  ip: z.string().min(1),
  domain: z.string().nullable(),
  email: z.string().email().nullable(),
  dataDir: z.string().min(1),
  serverId: z.string().uuid().optional(),
  staticDir: z.string().optional(),
  maxSiteSize: z
    .number()
    .optional()
    .default(500 * 1024 * 1024),
  adminAuthMode: z.enum(['p12', 'hardware-bound']).optional().default('p12'),
  panel2fa: z.object({
    enabled: z.boolean(),
    secret: z.string().nullable(),
    setupComplete: z.boolean(),
  }).optional().default({ enabled: false, secret: null, setupComplete: false }),
  sessionSecret: z.string().nullable().optional().default(null),
  onboarding: z.object({
    status: z.enum(['FRESH', 'DOMAIN_SET', 'DNS_READY', 'PROVISIONING', 'COMPLETED']),
  }),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..', '..');

let config = null;
let configPath = null;

function resolveConfigPath() {
  if (process.env.PORTLAMA_CONFIG) {
    return process.env.PORTLAMA_CONFIG;
  }

  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

  if (isDev) {
    return path.resolve(packageRoot, 'dev', 'panel.json');
  }

  return '/etc/portlama/panel.json';
}

export async function loadConfig() {
  configPath = resolveConfigPath();

  let raw;
  try {
    raw = await readFile(configPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Config file not found at ${configPath}. Run create-portlama to initialize.`);
    }
    throw new Error(`Failed to read config file at ${configPath}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Config file at ${configPath} contains invalid JSON.`);
  }

  const validated = ConfigSchema.parse(parsed);

  // Auto-generate serverId if missing — used as bucket prefix for multi-server isolation
  if (!validated.serverId) {
    validated.serverId = crypto.randomUUID();
    const tmpPath = `${configPath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(validated, null, 2) + '\n', {
      encoding: 'utf-8',
      mode: 0o600,
    });
    const fd = await open(tmpPath, 'r');
    await fd.sync();
    await fd.close();
    await rename(tmpPath, configPath);
  }

  config = validated;
  return structuredClone(config);
}

export function getConfig() {
  if (config === null) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return structuredClone(config);
}

export async function updateConfig(patch) {
  if (config === null) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }

  const merged = structuredClone(config);

  for (const key of Object.keys(patch)) {
    if (key === 'onboarding' && typeof patch.onboarding === 'object' && patch.onboarding !== null) {
      merged.onboarding = { ...merged.onboarding, ...patch.onboarding };
    } else if (key === 'panel2fa' && typeof patch.panel2fa === 'object' && patch.panel2fa !== null) {
      merged.panel2fa = { ...merged.panel2fa, ...patch.panel2fa };
    } else {
      merged[key] = patch[key];
    }
  }

  const validated = ConfigSchema.parse(merged);

  const tmpPath = `${configPath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(validated, null, 2) + '\n', {
    encoding: 'utf-8',
    mode: 0o600,
  });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, configPath);

  config = validated;
  return structuredClone(config);
}

export function getConfigPath() {
  return configPath ?? resolveConfigPath();
}
