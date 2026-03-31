import crypto from 'node:crypto';
import { readFile, writeFile, rename, open } from 'node:fs/promises';
import path from 'node:path';

const STATE_DIR = process.env.PORTLAMA_STATE_DIR || '/etc/portlama';
const STORAGE_CONFIG_PATH = path.join(STATE_DIR, 'storage-config.json');
const MASTER_KEY_PATH = path.join(STATE_DIR, 'storage-master.key');

// --- Promise-chain mutex ---
// Serializes all storage config read-modify-write operations.
let storageLock = Promise.resolve();
function withStorageLock(fn) {
  const prev = storageLock;
  let resolve;
  storageLock = new Promise((r) => {
    resolve = r;
  });
  return prev.then(fn).finally(resolve);
}

// --- Master key management ---

let cachedMasterKey = null;

async function loadOrCreateMasterKey() {
  if (cachedMasterKey) return cachedMasterKey;

  try {
    const buf = await readFile(MASTER_KEY_PATH);
    if (buf.length !== 32) {
      throw new Error(`Master key file has unexpected length: ${buf.length}`);
    }
    cachedMasterKey = buf;
    return cachedMasterKey;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Generate new master key
  const key = crypto.randomBytes(32);
  const tmpPath = `${MASTER_KEY_PATH}.tmp`;
  await writeFile(tmpPath, key, { mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, MASTER_KEY_PATH);

  cachedMasterKey = key;
  return cachedMasterKey;
}

// --- AES-256-GCM encryption ---

const SCRYPT_SALT_LEN = 16;
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const SCRYPT_KEYLEN = 32;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function scryptDeriveKey(masterKey, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(masterKey, salt, SCRYPT_KEYLEN, SCRYPT_PARAMS, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
}

/**
 * Encrypt a plaintext string. Returns a base64-encoded packed buffer:
 * [salt (16)] [iv (12)] [authTag (16)] [ciphertext (...)]
 */
export async function encryptCredential(plaintext) {
  const masterKey = await loadOrCreateMasterKey();
  const salt = crypto.randomBytes(SCRYPT_SALT_LEN);
  const derivedKey = await scryptDeriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const packed = Buffer.concat([salt, iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a base64-encoded packed buffer back to plaintext string.
 */
export async function decryptCredential(packed) {
  const masterKey = await loadOrCreateMasterKey();
  const buf = Buffer.from(packed, 'base64');

  const minLen = SCRYPT_SALT_LEN + IV_LEN + AUTH_TAG_LEN + 1;
  if (buf.length < minLen) {
    throw new Error('Encrypted credential is corrupted or truncated');
  }

  const salt = buf.subarray(0, SCRYPT_SALT_LEN);
  const iv = buf.subarray(SCRYPT_SALT_LEN, SCRYPT_SALT_LEN + IV_LEN);
  const authTag = buf.subarray(SCRYPT_SALT_LEN + IV_LEN, SCRYPT_SALT_LEN + IV_LEN + AUTH_TAG_LEN);
  const ciphertext = buf.subarray(SCRYPT_SALT_LEN + IV_LEN + AUTH_TAG_LEN);

  const derivedKey = await scryptDeriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf-8');
}

// --- Storage config persistence ---

async function readStorageConfig() {
  try {
    const raw = await readFile(STORAGE_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      servers: Array.isArray(parsed.servers) ? parsed.servers : [],
      bindings: Array.isArray(parsed.bindings) ? parsed.bindings : [],
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { servers: [], bindings: [] };
    }
    throw new Error(`Failed to read storage config: ${err.message}`);
  }
}

async function writeStorageConfig(data) {
  const tmpPath = `${STORAGE_CONFIG_PATH}.tmp`;
  const content = JSON.stringify(data, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmpPath, STORAGE_CONFIG_PATH);
}

// --- Public API ---

/**
 * Register a storage server. Encrypts credentials before persisting.
 * Returns the entry without credentials.
 */
export function registerStorageServer({ id, label, provider, region, bucket, endpoint, accessKey, secretKey }) {
  return withStorageLock(async () => {
    const config = await readStorageConfig();

    if (config.servers.some((s) => s.id === id)) {
      const err = new Error(`Storage server with id "${id}" already registered`);
      err.statusCode = 409;
      throw err;
    }

    const entry = {
      id,
      label,
      provider,
      region,
      bucket,
      endpoint,
      accessKeyEncrypted: await encryptCredential(accessKey),
      secretKeyEncrypted: await encryptCredential(secretKey),
      registeredAt: new Date().toISOString(),
    };

    config.servers.push(entry);
    await writeStorageConfig(config);

    return {
      id: entry.id,
      label: entry.label,
      provider: entry.provider,
      region: entry.region,
      bucket: entry.bucket,
      endpoint: entry.endpoint,
      registeredAt: entry.registeredAt,
    };
  });
}

/**
 * Remove a storage server and any bindings referencing it.
 */
export function removeStorageServer(id) {
  return withStorageLock(async () => {
    const config = await readStorageConfig();
    const idx = config.servers.findIndex((s) => s.id === id);

    if (idx === -1) {
      const err = new Error(`Storage server "${id}" not found`);
      err.statusCode = 404;
      throw err;
    }

    config.servers.splice(idx, 1);
    config.bindings = config.bindings.filter((b) => b.storageServerId !== id);
    await writeStorageConfig(config);

    return { ok: true };
  });
}

/**
 * List registered storage servers with credentials redacted.
 */
export async function listStorageServers() {
  const config = await readStorageConfig();
  return config.servers.map((s) => ({
    id: s.id,
    label: s.label,
    provider: s.provider,
    region: s.region,
    bucket: s.bucket,
    endpoint: s.endpoint,
    registeredAt: s.registeredAt,
  }));
}

/**
 * Bind a storage server to a plugin. One binding per plugin.
 */
export function bindPluginStorage(pluginName, storageServerId) {
  return withStorageLock(async () => {
    const config = await readStorageConfig();

    if (!config.servers.some((s) => s.id === storageServerId)) {
      const err = new Error(`Storage server "${storageServerId}" not found`);
      err.statusCode = 404;
      throw err;
    }

    if (config.bindings.some((b) => b.pluginName === pluginName)) {
      const err = new Error(`Plugin "${pluginName}" already has a storage binding — unbind first`);
      err.statusCode = 409;
      throw err;
    }

    const binding = {
      pluginName,
      storageServerId,
      boundAt: new Date().toISOString(),
    };

    config.bindings.push(binding);
    await writeStorageConfig(config);

    return binding;
  });
}

/**
 * Remove storage binding for a plugin.
 */
export function unbindPluginStorage(pluginName) {
  return withStorageLock(async () => {
    const config = await readStorageConfig();
    const idx = config.bindings.findIndex((b) => b.pluginName === pluginName);

    if (idx === -1) {
      const err = new Error(`No storage binding for plugin "${pluginName}"`);
      err.statusCode = 404;
      throw err;
    }

    config.bindings.splice(idx, 1);
    await writeStorageConfig(config);

    return { ok: true };
  });
}

/**
 * List all bindings.
 */
export async function listBindings() {
  const config = await readStorageConfig();
  return config.bindings;
}

/**
 * Get binding for a specific plugin, including redacted storage server info.
 */
export async function getBinding(pluginName) {
  const config = await readStorageConfig();
  const binding = config.bindings.find((b) => b.pluginName === pluginName);

  if (!binding) return null;

  const server = config.servers.find((s) => s.id === binding.storageServerId);
  return {
    ...binding,
    server: server
      ? {
          id: server.id,
          label: server.label,
          provider: server.provider,
          region: server.region,
          bucket: server.bucket,
          endpoint: server.endpoint,
          registeredAt: server.registeredAt,
        }
      : null,
  };
}

/**
 * Get decrypted storage config for a bound plugin.
 * Returns null if unbound.
 */
export async function getPluginStorageConfig(pluginName) {
  const config = await readStorageConfig();
  const binding = config.bindings.find((b) => b.pluginName === pluginName);

  if (!binding) return null;

  const server = config.servers.find((s) => s.id === binding.storageServerId);
  if (!server) return null;

  return {
    provider: server.provider,
    region: server.region,
    bucket: server.bucket,
    endpoint: server.endpoint,
    accessKey: await decryptCredential(server.accessKeyEncrypted),
    secretKey: await decryptCredential(server.secretKeyEncrypted),
  };
}
