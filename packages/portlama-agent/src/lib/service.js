/**
 * Unified service management interface.
 *
 * Dispatches to launchctl (macOS) or systemctl (Linux) based on process.platform.
 */

import { execa } from 'execa';
import { isDarwin } from './platform.js';

// Lazy imports for macOS-specific modules to avoid loading them on Linux

/**
 * Check if the agent service is currently loaded/active.
 * @returns {Promise<boolean>}
 */
export async function isAgentLoaded() {
  if (isDarwin()) {
    const { isAgentLoaded: macIsLoaded } = await import('./launchctl.js');
    return macIsLoaded();
  }
  return systemctlIsActive();
}

/**
 * Get the PID of the running agent, or null if not running.
 * @returns {Promise<number | null>}
 */
export async function getAgentPid() {
  if (isDarwin()) {
    const { getAgentPid: macGetPid } = await import('./launchctl.js');
    return macGetPid();
  }
  return systemctlGetPid();
}

/**
 * Load/start the agent service.
 */
export async function loadAgent() {
  if (isDarwin()) {
    const { loadAgent: macLoad } = await import('./launchctl.js');
    return macLoad();
  }
  return systemctlStart();
}

/**
 * Unload/stop the agent service. Silent if not loaded.
 */
export async function unloadAgent() {
  if (isDarwin()) {
    const { unloadAgent: macUnload } = await import('./launchctl.js');
    return macUnload();
  }
  return systemctlStop();
}

// ---------------------------------------------------------------------------
// Linux / systemd helpers
// ---------------------------------------------------------------------------

async function systemctlIsActive() {
  try {
    await execa('systemctl', ['is-active', '--quiet', 'portlama-chisel']);
    return true;
  } catch {
    return false;
  }
}

async function systemctlGetPid() {
  try {
    const { stdout } = await execa('systemctl', [
      'show',
      '-p',
      'MainPID',
      '--value',
      'portlama-chisel',
    ]);
    const pid = parseInt(stdout.trim(), 10);
    return Number.isNaN(pid) || pid <= 0 ? null : pid;
  } catch {
    return null;
  }
}

async function systemctlStart() {
  try {
    await execa('systemctl', ['daemon-reload']);
    await execa('systemctl', ['enable', '--now', 'portlama-chisel']);
  } catch (err) {
    throw new Error(`Failed to start agent: ${err.stderr || err.message}`);
  }
}

async function systemctlStop() {
  try {
    await execa('systemctl', ['disable', '--now', 'portlama-chisel']);
  } catch {
    // Agent may not be active — this is fine
  }
}
