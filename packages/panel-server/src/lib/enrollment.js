import crypto from 'node:crypto';
import { readFile, writeFile, rename, open } from 'node:fs/promises';
import path from 'node:path';
import { loadAgentRegistry, PLUGIN_AGENT_CN_PREFIX, BASE_CAPABILITIES } from './mtls.js';
import { isRegisteredTicketScope } from './tickets.js';

const PKI_DIR = process.env.PORTLAMA_PKI_DIR || '/etc/portlama/pki';
const TOKENS_PATH = path.join(PKI_DIR, 'enrollment-tokens.json');

/**
 * Token expiry for enrollment (10 minutes).
 */
const TOKEN_EXPIRY_MS = 10 * 60 * 1000;

/**
 * Stale token cleanup threshold (1 hour).
 */
const CLEANUP_THRESHOLD_MS = 60 * 60 * 1000;

/**
 * Promise-chain mutex to serialize token file operations,
 * preventing race conditions on concurrent token creation/consumption.
 */
let tokenLock = Promise.resolve();
function withTokenLock(fn) {
  const prev = tokenLock;
  let resolve;
  tokenLock = new Promise((r) => {
    resolve = r;
  });
  return prev.then(fn).finally(resolve);
}

/**
 * Per-process random key for HMAC-based timing-safe comparison.
 * HMAC produces fixed-length digests, eliminating length-leaking branches.
 */
const COMPARE_KEY = crypto.randomBytes(32);

/**
 * Timing-safe token comparison via HMAC-SHA256.
 * Both inputs are hashed to fixed-length digests before comparison,
 * preventing timing side-channel attacks that leak token length.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeTokenCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = crypto.createHmac('sha256', COMPARE_KEY).update(a).digest();
  const hb = crypto.createHmac('sha256', COMPARE_KEY).update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Load enrollment tokens from disk.
 * Returns an empty array if the file does not exist.
 *
 * @returns {Promise<Array>}
 */
async function loadTokens() {
  try {
    const raw = await readFile(TOKENS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tokens)) {
      return [];
    }
    return parsed.tokens;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Failed to read enrollment tokens: ${err.message}`);
  }
}

/**
 * Atomically save enrollment tokens to disk.
 * Writes to a temp file with restrictive permissions, fsyncs, then renames.
 *
 * @param {Array} tokens
 */
async function saveTokens(tokens) {
  const tmpPath = `${TOKENS_PATH}.tmp`;
  const content = JSON.stringify({ tokens }, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });

  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();

  await rename(tmpPath, TOKENS_PATH);
}

/**
 * Remove tokens that are older than the cleanup threshold.
 *
 * @param {Array} tokens
 * @returns {Array} Cleaned token list
 */
function cleanExpiredTokens(tokens) {
  const cutoff = Date.now() - CLEANUP_THRESHOLD_MS;
  return tokens.filter((t) => new Date(t.createdAt).getTime() > cutoff);
}

/**
 * Create a one-time enrollment token for agent certificate enrollment.
 *
 * Validates that no duplicate active (non-revoked) agent label exists in the
 * registry. Generates a cryptographically random token with a 10-minute expiry.
 *
 * @param {string} label - Agent label (e.g. "macbook-pro")
 * @param {string[]} capabilities - Capability list
 * @param {string[]} allowedSites - Allowed site labels
 * @param {import('pino').Logger} logger
 * @returns {Promise<{ token: string, label: string, expiresAt: string }>}
 */
export async function createEnrollmentToken(label, capabilities, allowedSites, logger) {
  return withTokenLock(async () => {
    // Check registry for duplicate (non-revoked) label
    const registry = await loadAgentRegistry();
    const existing = registry.agents.find((a) => a.label === label && !a.revoked);
    if (existing) {
      throw Object.assign(new Error(`Agent certificate with label "${label}" already exists`), {
        statusCode: 409,
      });
    }

    let tokens = await loadTokens();

    // Clean expired tokens lazily
    tokens = cleanExpiredTokens(tokens);

    // Replace any active (unused, unexpired) token for the same label so that
    // retried installations don't fail with a 409.
    const now = Date.now();
    tokens = tokens.filter(
      (t) => !(t.label === label && !t.used && new Date(t.expiresAt).getTime() > now),
    );

    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    tokens.push({
      token,
      label,
      capabilities,
      allowedSites,
      createdAt,
      expiresAt,
      used: false,
    });

    await saveTokens(tokens);
    logger.info({ label, expiresAt }, 'Created enrollment token');

    return { token, label, expiresAt };
  });
}

/**
 * Validate and consume a one-time enrollment token.
 *
 * Finds the token using timing-safe comparison, verifies it is not used
 * and not expired, marks it as used, saves atomically, and returns the
 * associated enrollment data. Serialized via mutex to prevent TOCTOU races.
 *
 * @param {string} token - The enrollment token to validate
 * @returns {Promise<{ label: string, capabilities: string[], allowedSites: string[] }>}
 */
export async function validateAndConsumeToken(token) {
  return withTokenLock(async () => {
    let tokens = await loadTokens();

    // Clean expired tokens lazily
    tokens = cleanExpiredTokens(tokens);

    // Timing-safe comparison to prevent side-channel attacks on the token
    const entry = tokens.find((t) => safeTokenCompare(t.token, token));

    if (!entry) {
      throw Object.assign(new Error('Invalid enrollment token'), { statusCode: 401 });
    }

    if (entry.used) {
      throw Object.assign(new Error('Enrollment token has already been used'), { statusCode: 401 });
    }

    if (new Date(entry.expiresAt).getTime() < Date.now()) {
      throw Object.assign(new Error('Enrollment token has expired'), { statusCode: 401 });
    }

    // For delegated tokens, re-check that the delegating agent is still valid.
    // The agent may have been revoked between token creation and consumption.
    if (entry.type === 'delegated' && entry.delegatedBy) {
      const registry = await loadAgentRegistry();
      const delegator = registry.agents.find((a) => a.label === entry.delegatedBy && !a.revoked);
      if (!delegator) {
        throw Object.assign(new Error('Invalid enrollment token'), { statusCode: 401 });
      }
    }

    // Mark as used
    entry.used = true;
    entry.usedAt = new Date().toISOString();

    await saveTokens(tokens);

    /** @type {{ label: string, capabilities: string[], allowedSites: string[], type?: string, delegatedBy?: string, scope?: string }} */
    const result = {
      label: entry.label,
      capabilities: entry.capabilities,
      allowedSites: entry.allowedSites,
    };

    if (entry.type) {
      result.type = entry.type;
    }
    if (entry.delegatedBy) {
      result.delegatedBy = entry.delegatedBy;
    }
    if (entry.scope) {
      result.scope = entry.scope;
    }

    return result;
  });
}

/**
 * Create a one-time delegated enrollment token for plugin agent certificate enrollment.
 *
 * A delegated enrollment allows a Portlama agent (hosting a standalone plugin server)
 * to vouch for a plugin agent (e.g., a Sync agent on a Raspberry Pi) that needs a
 * minimal Portlama certificate for ticket system participation.
 *
 * @param {string} delegatingLabel - Label of the agent that is vouching (must be registered, non-revoked)
 * @param {string} scope - Ticket scope this delegation is for (e.g., "sync:connect")
 * @param {string} pluginAgentLabel - Label for the new plugin agent
 * @param {import('pino').Logger} logger
 * @returns {Promise<{ token: string, pluginAgentLabel: string, expiresAt: string }>}
 */
export async function createDelegatedEnrollmentToken(delegatingLabel, scope, pluginAgentLabel, logger) {
  // Validate that the scope is a registered ticket scope, not a base capability.
  // Base capabilities (tunnels:read, services:write, etc.) must never be delegated
  // through enrollment — they are admin-assigned per-agent.
  // These checks run outside the token lock because scope validation is independent
  // of token file operations and avoids nesting the ticket lock inside the token lock.
  if (BASE_CAPABILITIES.includes(scope)) {
    throw Object.assign(
      new Error('Scope conflicts with a base capability'),
      { statusCode: 400 },
    );
  }

  const isTicketScope = await isRegisteredTicketScope(scope);
  if (!isTicketScope) {
    throw Object.assign(
      new Error(`Scope "${scope}" is not a registered ticket scope`),
      { statusCode: 400 },
    );
  }

  return withTokenLock(async () => {
    // Validate that the delegating agent is registered and non-revoked
    const registry = await loadAgentRegistry();
    const delegatingAgent = registry.agents.find((a) => a.label === delegatingLabel && !a.revoked);
    if (!delegatingAgent) {
      throw Object.assign(new Error(`Delegating agent "${delegatingLabel}" not found or revoked`), {
        statusCode: 404,
      });
    }

    // Build the full plugin-agent label for registry uniqueness check
    const fullLabel = `${PLUGIN_AGENT_CN_PREFIX}${delegatingLabel}:${pluginAgentLabel}`;

    // Check registry for duplicate (non-revoked) plugin-agent label
    const existing = registry.agents.find((a) => a.label === fullLabel && !a.revoked);
    if (existing) {
      throw Object.assign(
        new Error(`Plugin agent certificate with label "${pluginAgentLabel}" for delegator "${delegatingLabel}" already exists`),
        { statusCode: 409 },
      );
    }

    let tokens = await loadTokens();

    // Clean expired tokens lazily
    tokens = cleanExpiredTokens(tokens);

    // Replace any active (unused, unexpired) token for the same full label
    const now = Date.now();
    tokens = tokens.filter(
      (t) => !(t.label === fullLabel && !t.used && new Date(t.expiresAt).getTime() > now),
    );

    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString();

    tokens.push({
      token,
      label: fullLabel,
      capabilities: [scope],
      allowedSites: [],
      type: 'delegated',
      delegatedBy: delegatingLabel,
      scope,
      createdAt,
      expiresAt,
      used: false,
    });

    await saveTokens(tokens);
    logger.info(
      { delegatingLabel, pluginAgentLabel, scope, expiresAt },
      'Created delegated enrollment token',
    );

    return { token, pluginAgentLabel, expiresAt };
  });
}

/**
 * Revoke an unused enrollment token for a given label.
 *
 * Removes any active (unused, unexpired) token matching the label.
 * This should be called when an agent installation fails before enrollment
 * to prevent the token from being used on another machine.
 *
 * @param {string} label - Agent label whose token should be revoked
 * @param {import('pino').Logger} logger
 * @returns {Promise<{ revoked: boolean }>}
 */
export async function revokeEnrollmentToken(label, logger) {
  return withTokenLock(async () => {
    let tokens = await loadTokens();
    tokens = cleanExpiredTokens(tokens);

    const now = Date.now();
    const before = tokens.length;
    tokens = tokens.filter(
      (t) => !(t.label === label && !t.used && new Date(t.expiresAt).getTime() > now),
    );
    const revoked = tokens.length < before;

    if (revoked) {
      await saveTokens(tokens);
      logger.info({ label }, 'Revoked unused enrollment token');
    }

    return { revoked };
  });
}
