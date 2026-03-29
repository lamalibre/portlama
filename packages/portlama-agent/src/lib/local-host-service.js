/**
 * Local plugin host service management.
 *
 * Manages a launchd (macOS) or user-level systemd (Linux) service for the
 * local plugin host Fastify server. Unlike per-agent services, this uses
 * user-level systemd (~/.config/systemd/user/) since no root is needed.
 */

import { writeFile, rename, mkdir, unlink, open } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import {
  isDarwin,
  localHostPlistLabel,
  localHostPlistPath,
  localHostSystemdUnitName,
  localHostSystemdUnitPath,
  localHostLogFile,
  localHostErrorLogFile,
  localHostLogsDir,
} from './platform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the absolute path to the local-plugin-host-entry.js script.
 * @returns {string}
 */
function hostEntryPath() {
  return path.resolve(__dirname, '..', 'local-plugin-host-entry.js');
}

/**
 * Generate the local host service config.
 * @param {number} [port=9293]
 * @returns {string}
 */
export function generateLocalHostServiceConfig(port = 9293) {
  if (isDarwin()) {
    return generateLocalHostPlist(port);
  }
  return generateLocalHostSystemdUnit(port);
}

/**
 * Write the local host service config to the appropriate location.
 * @param {string} content
 */
export async function writeLocalHostServiceConfig(content) {
  if (isDarwin()) {
    return writeLocalHostPlist(content);
  }
  return writeLocalHostSystemdUnit(content);
}

/**
 * Check if the local host service is loaded/active.
 * @returns {Promise<boolean>}
 */
export async function isLocalHostLoaded() {
  if (isDarwin()) {
    return macIsLocalHostLoaded();
  }
  return systemctlIsLocalHostActive();
}

/**
 * Start the local host service.
 */
export async function loadLocalHost() {
  if (isDarwin()) {
    return macLoadLocalHost();
  }
  return systemctlStartLocalHost();
}

/**
 * Stop the local host service. Silent if not loaded.
 */
export async function unloadLocalHost() {
  if (isDarwin()) {
    return macUnloadLocalHost();
  }
  return systemctlStopLocalHost();
}

/**
 * Restart the local host service (stop + start).
 */
export async function restartLocalHost() {
  await unloadLocalHost();
  await loadLocalHost();
}

/**
 * Remove the local host service config file.
 */
export async function removeLocalHostServiceConfig() {
  const filePath = isDarwin() ? localHostPlistPath() : localHostSystemdUnitPath();
  try {
    await unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (!isDarwin()) {
    try {
      await execa('systemctl', ['--user', 'daemon-reload']);
    } catch {
      // best-effort
    }
  }
}

// ---------------------------------------------------------------------------
// macOS — plist
// ---------------------------------------------------------------------------

function generateLocalHostPlist(port) {
  const xmlEsc = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const nodePath = process.execPath;
  const entryPath = hostEntryPath();
  const serviceLabel = localHostPlistLabel();
  const logFile = localHostLogFile();
  const errorLogFile = localHostErrorLogFile();

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${xmlEsc(serviceLabel)}</string>

    <key>ProgramArguments</key>
    <array>
        <string>${xmlEsc(nodePath)}</string>
        <string>${xmlEsc(entryPath)}</string>
        <string>--port</string>
        <string>${port}</string>
    </array>

    <key>KeepAlive</key>
    <true/>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardOutPath</key>
    <string>${xmlEsc(logFile)}</string>

    <key>StandardErrorPath</key>
    <string>${xmlEsc(errorLogFile)}</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
`;
}

async function writeLocalHostPlist(content) {
  const filePath = localHostPlistPath();
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
  await mkdir(localHostLogsDir(), { recursive: true });
  const tmp = filePath + '.tmp';
  await writeFile(tmp, content, 'utf8');
  const fd = await open(tmp, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmp, filePath);
}

async function macIsLocalHostLoaded() {
  try {
    const { stdout } = await execa('launchctl', ['list']);
    const serviceLabel = localHostPlistLabel();
    return stdout.split('\n').some((line) => {
      const cols = line.trim().split(/\s+/);
      return cols[2] === serviceLabel;
    });
  } catch {
    return false;
  }
}

async function macLoadLocalHost() {
  const filePath = localHostPlistPath();
  await execa('launchctl', ['load', filePath]);
}

async function macUnloadLocalHost() {
  try {
    const filePath = localHostPlistPath();
    await execa('launchctl', ['unload', filePath]);
  } catch {
    // may not be loaded — that is fine
  }
}

// ---------------------------------------------------------------------------
// Linux — user-level systemd
// ---------------------------------------------------------------------------

function generateLocalHostSystemdUnit(port) {
  const systemdQuote = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

  const nodePath = process.execPath;
  const entryPath = hostEntryPath();
  const logFile = localHostLogFile();
  const errorLogFile = localHostErrorLogFile();
  const logsDir = localHostLogsDir();

  const execStart = [nodePath, entryPath, '--port', String(port)]
    .map(systemdQuote)
    .join(' ');

  return `[Unit]
Description=Portlama Local Plugin Host
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${execStart}
Restart=always
RestartSec=5
StandardOutput=append:${logFile}
StandardError=append:${errorLogFile}
Environment=PATH=/usr/local/bin:/usr/bin:/bin
NoNewPrivileges=true
ReadWritePaths=${logsDir}

[Install]
WantedBy=default.target
`;
}

async function writeLocalHostSystemdUnit(content) {
  const logsDir = localHostLogsDir();
  await mkdir(logsDir, { recursive: true });

  const filePath = localHostSystemdUnitPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + '.tmp';
  await writeFile(tmp, content, { encoding: 'utf8', mode: 0o644 });
  const fd = await open(tmp, 'r');
  await fd.sync();
  await fd.close();
  await rename(tmp, filePath);

  await execa('systemctl', ['--user', 'daemon-reload']);
}

async function systemctlIsLocalHostActive() {
  try {
    await execa('systemctl', ['--user', 'is-active', '--quiet', localHostSystemdUnitName()]);
    return true;
  } catch {
    return false;
  }
}

async function systemctlStartLocalHost() {
  try {
    await execa('systemctl', ['--user', 'daemon-reload']);
    await execa('systemctl', ['--user', 'enable', '--now', localHostSystemdUnitName()]);
  } catch (err) {
    throw new Error(`Failed to start local plugin host: ${err.stderr || err.message}`);
  }
}

async function systemctlStopLocalHost() {
  try {
    await execa('systemctl', ['--user', 'disable', '--now', localHostSystemdUnitName()]);
  } catch {
    // may not be active — that is fine
  }
}
