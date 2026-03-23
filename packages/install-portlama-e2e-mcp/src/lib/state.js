// ============================================================================
// State Management
// ============================================================================
// Tracks VM state, run history, and snapshot inventory in a JSON file.
// Written to TEMP_DIR/state.json for intermediate runs.

import fs from 'node:fs';
import path from 'node:path';
import { TEMP_DIR } from '../config.js';

const STATE_FILE = path.join(TEMP_DIR, 'state.json');

/** Ensure TEMP_DIR exists with owner-only permissions. */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true, mode: 0o700 });
  }
}

function defaultState() {
  return {
    vms: {},
    profile: null,
    domain: null,
    credentials: null,
    lastRun: null,
    runs: [],
  };
}

/** Load state from disk. Returns default state if file doesn't exist. */
export function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

/** Persist state to disk with restricted permissions (0o600). */
export function saveState(state) {
  ensureTempDir();
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, STATE_FILE);
}

/** Update a subset of state fields. */
export function updateState(partial) {
  const state = loadState();
  Object.assign(state, partial);
  saveState(state);
  return state;
}

/** Record VM info in state. */
export function setVmState(name, info) {
  const state = loadState();
  state.vms[name] = { ...state.vms[name], ...info, updatedAt: new Date().toISOString() };
  saveState(state);
}

/** Remove a VM from state. */
export function removeVmState(name) {
  const state = loadState();
  delete state.vms[name];
  saveState(state);
}

/** Record a test run result. */
export function recordRun(run) {
  const state = loadState();
  state.lastRun = run.id;
  state.runs.push(run);
  // Keep last 20 runs
  if (state.runs.length > 20) {
    state.runs = state.runs.slice(-20);
  }
  saveState(state);
}
