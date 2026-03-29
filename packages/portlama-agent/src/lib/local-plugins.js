import { readFile, writeFile, rename, open, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { execa } from 'execa';
import { localDir, localPluginsFile, localPluginsDir } from './platform.js';

// Reserved names that cannot be used as plugin names (matches panel-server constants).
const RESERVED_NAMES = [
  'health', 'onboarding', 'invite', 'enroll', 'tunnels', 'sites', 'system',
  'services', 'logs', 'users', 'certs', 'invitations', 'plugins', 'tickets', 'settings',
];

// --- Promise-chain mutex (serialises registry modifications) ---

let lockTail = Promise.resolve();

function withLock(fn) {
  const next = lockTail.then(fn, fn);
  lockTail = next.catch(() => {});
  return next;
}

// --- Registry read / write ---

/**
 * Read the local plugin registry.
 * @returns {Promise<{plugins: Array}>}
 */
export async function readLocalPluginRegistry() {
  try {
    const raw = await readFile(localPluginsFile(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.plugins) ? parsed : { plugins: [] };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { plugins: [] };
    }
    throw new Error(`Failed to read local plugin registry: ${err.message}`);
  }
}

/**
 * Write the local plugin registry atomically.
 * @param {object} data
 */
export async function writeLocalPluginRegistry(data) {
  const filePath = localPluginsFile();
  const tmpPath = `${filePath}.tmp`;

  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });

  const content = JSON.stringify(data, null, 2) + '\n';
  await writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o600 });

  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();

  await rename(tmpPath, filePath);
}

// --- Plugin lifecycle ---

/**
 * Install a plugin to the local plugin host.
 * @param {string} packageName - Must be @lamalibre/ scoped
 * @returns {Promise<object>} The new registry entry
 */
export function installLocalPlugin(packageName) {
  return withLock(async () => {
    if (!packageName.startsWith('@lamalibre/')) {
      throw new Error('Only @lamalibre/ scoped packages are allowed');
    }

    // Validate the portion after scope to prevent path traversal
    const pkgName = packageName.slice('@lamalibre/'.length);
    if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(pkgName)) {
      throw new Error('Invalid package name');
    }

    const registry = await readLocalPluginRegistry();
    if (registry.plugins.find((p) => p.packageName === packageName)) {
      throw new Error(`Plugin "${packageName}" is already installed`);
    }

    // Hard cap to prevent disk exhaustion
    if (registry.plugins.length >= 20) {
      throw new Error('Maximum of 20 local plugins allowed');
    }

    // Ensure local dir has a package.json so npm installs locally
    const dir = localDir();
    await mkdir(dir, { recursive: true, mode: 0o700 });
    const pkgJsonPath = path.join(dir, 'package.json');
    try {
      await readFile(pkgJsonPath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        await writeFile(pkgJsonPath, '{"private":true}\n', { encoding: 'utf-8', mode: 0o600 });
      }
    }

    // Install via npm
    await execa('npm', ['install', '--ignore-scripts', packageName], { cwd: dir, timeout: 120_000 });

    // Read and validate manifest
    let manifest;
    try {
      const require = createRequire(path.join(dir, '/'));
      const manifestPath = require.resolve(`${packageName}/portlama-plugin.json`);
      const manifestRaw = await readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestRaw);
    } catch {
      // Clean up on manifest failure
      await execa('npm', ['uninstall', packageName], { cwd: dir }).catch(() => {});
      throw new Error(`No valid portlama-plugin.json found in "${packageName}"`);
    }

    // Validate name
    if (!/^[a-z0-9-]+$/.test(manifest.name)) {
      await execa('npm', ['uninstall', packageName], { cwd: dir }).catch(() => {});
      throw new Error(`Invalid plugin name: "${manifest.name}"`);
    }

    if (RESERVED_NAMES.includes(manifest.name)) {
      await execa('npm', ['uninstall', packageName], { cwd: dir }).catch(() => {});
      throw new Error(`Plugin name "${manifest.name}" is reserved`);
    }

    // Check for duplicate name (different package, same manifest name)
    if (registry.plugins.find((p) => p.name === manifest.name)) {
      await execa('npm', ['uninstall', packageName], { cwd: dir }).catch(() => {});
      throw new Error(`A plugin named "${manifest.name}" is already installed`);
    }

    // Validate local mode support
    const modes = manifest.modes || ['server', 'agent'];
    if (!modes.includes('local')) {
      await execa('npm', ['uninstall', packageName], { cwd: dir }).catch(() => {});
      throw new Error(`Plugin "${manifest.name}" does not support local mode`);
    }

    // Create plugin data directory
    const pluginDir = path.join(localPluginsDir(), manifest.name);
    await mkdir(pluginDir, { recursive: true, mode: 0o700 });

    const entry = {
      name: manifest.name,
      displayName: manifest.displayName,
      packageName,
      version: manifest.version,
      description: manifest.description || '',
      capabilities: Array.isArray(manifest.capabilities) ? manifest.capabilities : [],
      packages: manifest.packages || {},
      panel: manifest.panel || {},
      modes,
      config: manifest.config || {},
      status: 'disabled',
      installedAt: new Date().toISOString(),
    };

    registry.plugins.push(entry);
    await writeLocalPluginRegistry(registry);
    return entry;
  });
}

/**
 * Uninstall a local plugin. Must be disabled first.
 * @param {string} name - Plugin name
 */
export function uninstallLocalPlugin(name) {
  return withLock(async () => {
    const registry = await readLocalPluginRegistry();
    const index = registry.plugins.findIndex((p) => p.name === name);
    if (index === -1) {
      throw new Error(`Plugin "${name}" not found`);
    }

    const plugin = registry.plugins[index];
    if (plugin.status === 'enabled') {
      throw new Error(`Plugin "${name}" must be disabled before uninstalling`);
    }

    if (!plugin.packageName.startsWith('@lamalibre/')) {
      throw new Error('Registry corruption: invalid package scope');
    }

    // npm uninstall
    await execa('npm', ['uninstall', plugin.packageName], { cwd: localDir() }).catch(() => {});

    // Remove plugin data directory
    const pluginDir = path.join(localPluginsDir(), plugin.name);
    await rm(pluginDir, { recursive: true, force: true }).catch(() => {});

    registry.plugins.splice(index, 1);
    await writeLocalPluginRegistry(registry);
  });
}

/**
 * Enable a local plugin.
 * @param {string} name
 */
export function enableLocalPlugin(name) {
  return withLock(async () => {
    const registry = await readLocalPluginRegistry();
    const plugin = registry.plugins.find((p) => p.name === name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }
    if (plugin.status === 'enabled') return;

    plugin.status = 'enabled';
    plugin.enabledAt = new Date().toISOString();
    await writeLocalPluginRegistry(registry);
  });
}

/**
 * Disable a local plugin.
 * @param {string} name
 */
export function disableLocalPlugin(name) {
  return withLock(async () => {
    const registry = await readLocalPluginRegistry();
    const plugin = registry.plugins.find((p) => p.name === name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }
    if (plugin.status === 'disabled') return;

    plugin.status = 'disabled';
    delete plugin.enabledAt;
    await writeLocalPluginRegistry(registry);
  });
}

/**
 * Read a plugin's panel.js bundle from the installed package.
 * @param {string} name - Plugin name
 * @returns {Promise<string>} JavaScript source
 */
export async function readLocalPluginBundle(name) {
  const registry = await readLocalPluginRegistry();
  const plugin = registry.plugins.find((p) => p.name === name);
  if (!plugin) {
    throw new Error(`Plugin "${name}" not found`);
  }

  const serverPkg = plugin.packages?.server;
  if (!serverPkg) {
    throw new Error(`Plugin "${name}" has no server package with panel bundle`);
  }

  // Defense-in-depth: verify scope in case registry was tampered
  if (!serverPkg.startsWith('@lamalibre/')) {
    throw new Error('Server package scope violation');
  }

  const require = createRequire(path.join(localDir(), '/'));
  const panelPath = require.resolve(`${serverPkg}/panel.js`);
  return readFile(panelPath, 'utf-8');
}
