// ============================================================================
// Two-Tier Log Management
// ============================================================================
// Tier 1 (intermediate): Structured JSON in TEMP_DIR/runs/<id>/
//   - summary.json: pass/fail counts, timing, error excerpts
//   - tests/<name>.json: per-test structured result
//   - logs/<name>.log: raw output (fetched on demand)
//
// Tier 2 (final/publish): Full Markdown in e2e-logs/ (current format)

import fs from 'node:fs';
import path from 'node:path';
import { TEMP_DIR } from '../config.js';

/** Validate that a path component contains no traversal sequences. */
function validatePathComponent(value, label) {
  if (value.includes('/') || value.includes('\\') || value.includes('..')) {
    throw new Error(`Invalid ${label}: must not contain path separators or ".."`)
  }
}

/** Create a new run directory and return its ID and paths. */
export function createRun() {
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(TEMP_DIR, 'runs', id);
  const testsDir = path.join(runDir, 'tests');
  const logsDir = path.join(runDir, 'logs');

  fs.mkdirSync(testsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  return { id, runDir, testsDir, logsDir };
}

/** Write a per-test structured result. */
export function writeTestResult(testsDir, testName, result) {
  const filePath = path.join(testsDir, `${testName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
}

/** Write raw log output for a test. */
export function writeTestLog(logsDir, testName, output) {
  const filePath = path.join(logsDir, `${testName}.log`);
  fs.writeFileSync(filePath, output);
}

/** Write the run summary. */
export function writeSummary(runDir, summary) {
  const filePath = path.join(runDir, 'summary.json');
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
}

/** Read a run summary. Returns null if not found. */
export function readSummary(runId) {
  validatePathComponent(runId, 'runId');
  const filePath = path.join(TEMP_DIR, 'runs', runId, 'summary.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Read raw log for a specific test in a run. */
export function readTestLog(runId, testName) {
  validatePathComponent(runId, 'runId');
  validatePathComponent(testName, 'testName');
  const filePath = path.join(TEMP_DIR, 'runs', runId, 'logs', `${testName}.log`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/** Read structured result for a specific test in a run. */
export function readTestResult(runId, testName) {
  validatePathComponent(runId, 'runId');
  validatePathComponent(testName, 'testName');
  const filePath = path.join(TEMP_DIR, 'runs', runId, 'tests', `${testName}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** List all run IDs, most recent first. */
export function listRuns() {
  const runsDir = path.join(TEMP_DIR, 'runs');
  try {
    return fs.readdirSync(runsDir).sort().reverse();
  } catch {
    return [];
  }
}

/**
 * Parse raw test output to extract error lines.
 * Looks for [FAIL] markers and assertion failures.
 */
export function extractErrors(rawOutput) {
  const lines = rawOutput.split('\n');
  const errors = [];

  for (const line of lines) {
    const stripped = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    if (
      stripped.includes('[FAIL]') ||
      stripped.includes('assertion failed') ||
      stripped.includes('FATAL') ||
      stripped.includes('returned 500') ||
      stripped.includes('exit code')
    ) {
      errors.push(stripped);
    }
  }

  return errors;
}

/**
 * Build a compact summary suitable for MCP tool response.
 * Only includes errors for failed tests — saves context.
 */
export function buildCompactSummary(summary) {
  const lines = [];
  lines.push(`Run: ${summary.runId}`);
  lines.push(`Passed: ${summary.passed}, Failed: ${summary.failed}, Skipped: ${summary.skipped}`);
  lines.push(`Duration: ${Math.round(summary.durationMs / 1000)}s`);

  if (summary.failed > 0) {
    lines.push('');
    lines.push('Failures:');
    for (const test of summary.tests) {
      if (test.status === 'failed') {
        lines.push(`  ${test.name}:`);
        for (const err of test.errors || []) {
          lines.push(`    - ${err}`);
        }
      }
    }
  }

  return lines.join('\n');
}
