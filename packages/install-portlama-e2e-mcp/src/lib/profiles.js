// ============================================================================
// VM Profile Selection & Hardware Detection
// ============================================================================

import os from 'node:os';
import { PROFILES } from '../config.js';

/** Parse a memory string like "2G" or "512M" into megabytes. */
function parseMemoryMB(mem) {
  const match = mem.match(/^(\d+(?:\.\d+)?)\s*([MG])$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return unit === 'G' ? value * 1024 : value;
}

/** Detect host hardware capabilities. */
export function detectHardware() {
  const cpus = os.cpus().length;
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const freeMemoryGB = os.freemem() / (1024 * 1024 * 1024);

  return {
    cpus,
    totalMemoryGB: Math.round(totalMemoryGB * 10) / 10,
    freeMemoryGB: Math.round(freeMemoryGB * 10) / 10,
  };
}

/**
 * Recommend a VM profile based on available hardware.
 * Returns { profile, name, supported[], note }.
 */
export function recommendProfile(hardware) {
  const vmCount = 3; // host + agent + visitor
  const hostReserveGB = 2; // leave for the host OS
  const availableMemoryGB = hardware.freeMemoryGB - hostReserveGB;
  const availableCpus = Math.max(1, hardware.cpus - 2);

  const supported = [];

  // Check each profile from most demanding to least
  for (const [name, profile] of Object.entries(PROFILES).reverse()) {
    const perVmMB = parseMemoryMB(profile.memory);
    const totalNeededMB = perVmMB * vmCount;
    const totalNeededGB = totalNeededMB / 1024;
    const cpusNeeded = profile.cpus * vmCount;

    if (totalNeededGB <= availableMemoryGB && cpusNeeded <= availableCpus) {
      supported.push(name);
    }
  }

  // production always fits (512M × 3 = 1.5G)
  if (!supported.includes('production')) {
    supported.push('production');
  }

  // Recommend the most capable supported profile
  const preference = ['performance', 'development', 'production'];
  const recommended = preference.find((p) => supported.includes(p)) || 'production';

  const profile = PROFILES[recommended];
  const note =
    `${vmCount} VMs × ${profile.memory} = ${(parseMemoryMB(profile.memory) * vmCount) / 1024}G` +
    ` (${Math.round(availableMemoryGB * 10) / 10}G available after ${hostReserveGB}G host reserve)`;

  return { profile, name: recommended, supported, note };
}
