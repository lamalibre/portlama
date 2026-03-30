/**
 * Storage server registry — manages ~/.portlama/storage-servers.json.
 *
 * Stores the list of provisioned storage servers (Spaces buckets, etc.).
 * Uses atomic writes (temp → 0600 → fsync → rename) for safety.
 * Mirrors the pattern from registry.ts (compute servers).
 */

import { readFile, writeFile, rename, mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { StorageServerEntry } from './types.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function agentDir(): string {
  return join(homedir(), '.portlama');
}

export function storageRegistryPath(): string {
  return join(agentDir(), 'storage-servers.json');
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/**
 * Load the storage server registry. Returns an empty array if the file does
 * not exist.
 */
export async function loadStorageServers(): Promise<StorageServerEntry[]> {
  try {
    const raw = await readFile(storageRegistryPath(), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StorageServerEntry[];
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

/**
 * Atomically save the storage server registry.
 */
export async function saveStorageServers(
  entries: readonly StorageServerEntry[],
): Promise<void> {
  const filePath = storageRegistryPath();
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const tmpPath = `${filePath}.tmp`;
  const content = JSON.stringify(entries, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });

  // fsync before rename for durability
  const fd = await open(tmpPath, 'r+');
  await fd.sync();
  await fd.close();

  await rename(tmpPath, filePath);
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/**
 * Add a storage server to the registry.
 */
export async function addStorageServer(
  entry: StorageServerEntry,
): Promise<void> {
  const servers = await loadStorageServers();
  servers.push(entry);
  await saveStorageServers(servers);
}

/**
 * Remove a storage server from the registry by ID.
 */
export async function removeStorageServer(id: string): Promise<void> {
  const servers = await loadStorageServers();
  const filtered = servers.filter((s) => s.id !== id);
  await saveStorageServers(filtered);
}

/**
 * Get a storage server by ID, or null if not found.
 */
export async function getStorageServer(
  id: string,
): Promise<StorageServerEntry | null> {
  const servers = await loadStorageServers();
  return servers.find((s) => s.id === id) ?? null;
}
