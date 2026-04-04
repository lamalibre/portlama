import crypto from 'node:crypto';
import { readFile, writeFile, rename, open, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DATA_DIR,
  GRANTS_FILE,
  MAX_GRANTS,
  GRANT_RETENTION_MS,
} from './constants.js';
import type {
  Grant,
  GrantState,
  CreateGrantOptions,
  GrantFilter,
} from './types.js';

const dataDir = process.env.PORTLAMA_DATA_DIR ?? DEFAULT_DATA_DIR;
const grantsPath = path.join(dataDir, GRANTS_FILE);

// ---------------------------------------------------------------------------
// Promise-chain mutex
// ---------------------------------------------------------------------------

let grantLock = Promise.resolve();

function withGrantLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = grantLock;
  let resolve: () => void;
  grantLock = new Promise<void>((r) => {
    resolve = r;
  });
  return prev.then(fn).finally(() => resolve());
}

// ---------------------------------------------------------------------------
// State I/O (atomic writes: tmp → fsync → rename)
// ---------------------------------------------------------------------------

interface GrantsState {
  grants: GrantState[];
}

async function loadGrants(): Promise<GrantsState> {
  try {
    const raw = await readFile(grantsPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && 'grants' in parsed) {
      const obj = parsed as Record<string, unknown>;
      return {
        grants: Array.isArray(obj.grants) ? (obj.grants as GrantState[]) : [],
      };
    }
    return { grants: [] };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { grants: [] };
    }
    throw new Error(
      `Failed to read grants state: ${(err as Error).message}`,
    );
  }
}

async function saveGrants(state: GrantsState): Promise<void> {
  await mkdir(path.dirname(grantsPath), { recursive: true });
  const tmpPath = `${grantsPath}.tmp`;
  const content = JSON.stringify(state, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, grantsPath);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Prune consumed grants older than the retention period.
 */
function pruneStaleGrants(grants: GrantState[]): GrantState[] {
  const cutoff = Date.now() - GRANT_RETENTION_MS;
  return grants.filter((g) => {
    if (!g.used || g.usedAt === null) return true;
    return new Date(g.usedAt).getTime() > cutoff;
  });
}

/**
 * Check if a grant should be auto-consumed on creation.
 * Tunnel grants and agent-side plugin grants are auto-consumed.
 * Local plugin grants start unused (consumed on enrollment).
 */
function shouldAutoConsume(options: CreateGrantOptions): boolean {
  if (options.resourceType === 'tunnel') return true;
  if (options.resourceType === 'plugin') {
    const target = (options.context?.['target'] as string) ?? 'local';
    return target.startsWith('agent:');
  }
  return true;
}

/**
 * Check if two grants are duplicates (same principal + resource + context).
 */
function isDuplicate(a: GrantState, b: CreateGrantOptions): boolean {
  if (a.principalType !== b.principalType) return false;
  if (a.principalId !== b.principalId) return false;
  if (a.resourceType !== b.resourceType) return false;
  if (a.resourceId !== b.resourceId) return false;

  const aCtx = JSON.stringify(a.context ?? {});
  const bCtx = JSON.stringify(b.context ?? {});
  return aCtx === bCtx;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createGrant(options: CreateGrantOptions): Promise<Grant> {
  return withGrantLock(async () => {
    const state = await loadGrants();

    // Prune stale grants on write operations
    state.grants = pruneStaleGrants(state.grants);

    if (state.grants.length >= MAX_GRANTS) {
      throw Object.assign(
        new Error(`Maximum number of grants (${MAX_GRANTS}) reached`),
        { statusCode: 503 },
      );
    }

    // Reject duplicates
    if (state.grants.some((g) => isDuplicate(g, options))) {
      throw Object.assign(
        new Error('Duplicate grant: a grant with the same principal, resource, and context already exists'),
        { statusCode: 409 },
      );
    }

    const autoConsume = shouldAutoConsume(options);
    const now = new Date().toISOString();

    const grant: GrantState = {
      grantId: crypto.randomUUID(),
      principalType: options.principalType,
      principalId: options.principalId,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      context: options.context ?? {},
      used: autoConsume,
      createdAt: now,
      usedAt: autoConsume ? now : null,
    };

    state.grants.push(grant);
    await saveGrants(state);
    return grant;
  });
}

export async function listGrants(filter?: GrantFilter): Promise<readonly Grant[]> {
  const state = await loadGrants();
  let grants: readonly GrantState[] = state.grants;

  if (filter) {
    grants = grants.filter((g) => {
      if (filter.principalType !== undefined && g.principalType !== filter.principalType) return false;
      if (filter.principalId !== undefined && g.principalId !== filter.principalId) return false;
      if (filter.resourceType !== undefined && g.resourceType !== filter.resourceType) return false;
      if (filter.resourceId !== undefined && g.resourceId !== filter.resourceId) return false;
      if (filter.used !== undefined && g.used !== filter.used) return false;
      return true;
    });
  }

  return grants;
}

export async function getGrant(grantId: string): Promise<Grant | null> {
  const state = await loadGrants();
  return state.grants.find((g) => g.grantId === grantId) ?? null;
}

export async function revokeGrant(grantId: string): Promise<Grant> {
  return withGrantLock(async () => {
    const state = await loadGrants();
    const idx = state.grants.findIndex((g) => g.grantId === grantId);
    if (idx === -1) {
      throw Object.assign(
        new Error('Grant not found'),
        { statusCode: 404 },
      );
    }

    const grant = state.grants[idx]!;

    // Local plugin grants: only revocable if unused
    if (
      grant.resourceType === 'plugin' &&
      (grant.context?.['target'] as string) === 'local' &&
      grant.used
    ) {
      throw Object.assign(
        new Error('Cannot revoke a consumed local plugin grant'),
        { statusCode: 409 },
      );
    }

    state.grants.splice(idx, 1);
    await saveGrants(state);
    return grant;
  });
}

/**
 * Consume a grant (mark as used). Used for local plugin enrollment.
 */
/**
 * Remove all grants matching a filter predicate.
 * Used by groups.ts for cascading deletes/renames — serialized via grantLock.
 */
export async function removeGrantsByPredicate(
  predicate: (g: GrantState) => boolean,
): Promise<number> {
  return withGrantLock(async () => {
    const state = await loadGrants();
    const before = state.grants.length;
    state.grants = state.grants.filter((g) => !predicate(g));
    const removed = before - state.grants.length;
    if (removed > 0) {
      await saveGrants(state);
    }
    return removed;
  });
}

/**
 * Update grants matching a filter predicate.
 * Used by groups.ts for cascading renames — serialized via grantLock.
 */
export async function updateGrantsByPredicate(
  predicate: (g: GrantState) => boolean,
  updater: (g: GrantState) => void,
): Promise<number> {
  return withGrantLock(async () => {
    const state = await loadGrants();
    let updated = 0;
    for (const grant of state.grants) {
      if (predicate(grant)) {
        updater(grant);
        updated++;
      }
    }
    if (updated > 0) {
      await saveGrants(state);
    }
    return updated;
  });
}

export async function consumeGrant(
  grantId: string,
  username: string,
): Promise<Grant> {
  return withGrantLock(async () => {
    const state = await loadGrants();
    const grant = state.grants.find((g) => g.grantId === grantId);
    if (!grant) {
      throw Object.assign(
        new Error('Grant not found'),
        { statusCode: 404 },
      );
    }

    if (grant.principalType !== 'user' || grant.principalId !== username) {
      throw Object.assign(
        new Error('Grant does not belong to this user'),
        { statusCode: 403 },
      );
    }

    if (grant.used) {
      throw Object.assign(
        new Error('Grant has already been consumed'),
        { statusCode: 409 },
      );
    }

    grant.used = true;
    grant.usedAt = new Date().toISOString();
    await saveGrants(state);
    return grant;
  });
}
