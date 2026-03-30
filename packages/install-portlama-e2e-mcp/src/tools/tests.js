// ============================================================================
// Test Execution Tools — test_run, test_run_all, test_list, test_reset, test_publish
// ============================================================================

import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import { execa } from 'execa';
import * as mp from '../lib/multipass.js';
import {
  resolveTestChain,
  getSingleVmTests,
  getThreeVmTests,
  SINGLE_VM_DEPS,
  THREE_VM_DEPS,
} from '../lib/deps.js';
import {
  createRun,
  writeTestResult,
  writeTestLog,
  writeSummary,
  extractErrors,
  buildCompactSummary,
} from '../lib/logs.js';
import { loadState, recordRun } from '../lib/state.js';
import {
  VM_HOST,
  VM_AGENT,
  VM_VISITOR,
  VM_STATIC_IPS,
  REPO_ROOT,
  THREE_VM_DIR,
  SINGLE_VM_DIR,
  E2E_LOGS_DIR,
  TEST_DOMAIN,
} from '../config.js';

/** Reset Authelia regulation state between tests. */
async function resetAuthelia() {
  await mp.exec(VM_HOST, 'systemctl stop authelia', {
    sudo: true,
    allowFailure: true,
  });
  await mp.exec(
    VM_HOST,
    'sqlite3 /etc/authelia/db.sqlite3 "DELETE FROM authentication_logs; DELETE FROM totp_history;"',
    { sudo: true, allowFailure: true },
  );
  await mp.exec(VM_HOST, 'systemctl start authelia', {
    sudo: true,
    allowFailure: true,
  });
  // Authelia needs a moment to start
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

/** Build the test environment object with VM IPs and credentials. */
async function buildTestEnv(state) {
  // Prefer static IPs from config (deterministic across snapshot restores),
  // fall back to Multipass query for VMs without static assignments.
  const [hostIp, agentIp, visitorIp] = await Promise.all([
    VM_STATIC_IPS[VM_HOST] || mp.getIp(VM_HOST),
    VM_STATIC_IPS[VM_AGENT] || mp.getIp(VM_AGENT),
    VM_STATIC_IPS[VM_VISITOR] || mp.getIp(VM_VISITOR),
  ]);
  const domain = state.domain || TEST_DOMAIN;

  return {
    HOST_IP: hostIp || '',
    AGENT_IP: agentIp || '',
    VISITOR_IP: visitorIp || '',
    TEST_DOMAIN: domain,
    ADMIN_PASSWORD: 'not-used-mTLS-only',
    AGENT_P12_PASSWORD: state.credentials?.agentP12Password || 'not-used-enrollment-flow',
    TEST_USER: 'testuser',
    TEST_USER_PASSWORD: 'TestPassword-E2E-123',
    LOG_LEVEL: '1',
    LOG_DIR: '/tmp',
  };
}

/** Finalize a test run: write summary, record in state, return MCP response. */
function finishRun(run, suite, target, testResults, startMs) {
  const summary = {
    runId: run.id,
    suite,
    target,
    passed: testResults.filter((t) => t.status === 'passed').length,
    failed: testResults.filter((t) => t.status === 'failed').length,
    skipped: 0,
    durationMs: Date.now() - startMs,
    tests: testResults,
  };

  writeSummary(run.runDir, summary);
  recordRun({ id: run.id, suite, target, timestamp: new Date().toISOString() });

  return {
    content: [{ type: 'text', text: buildCompactSummary(summary) }],
  };
}

/** Run a single three-VM test script and capture results. */
async function runThreeVmTest(testFile, env) {
  const scriptPath = path.join(THREE_VM_DIR, testFile);
  const startMs = Date.now();

  try {
    const result = await execa('bash', [scriptPath], {
      env,
      timeout: 300_000,
      all: true,
    });
    return {
      status: 'passed',
      durationMs: Date.now() - startMs,
      output: result.all || result.stdout,
      errors: [],
    };
  } catch (err) {
    const output = err.all || err.stderr || err.message;
    return {
      status: 'failed',
      durationMs: Date.now() - startMs,
      output,
      errors: extractErrors(output),
    };
  }
}

/** Run a single-VM test script on the host VM and capture results. */
async function runSingleVmTest(testFile) {
  const startMs = Date.now();
  const logFile = `/tmp/test-${testFile.replace('.sh', '')}.md`;

  const result = await mp.exec(
    VM_HOST,
    `LOG_DIR=/tmp SKIP_DNS_TESTS=1 _LOG_FILE=${logFile} bash /tmp/e2e-single/${testFile}`,
    { sudo: true, timeout: 300_000, allowFailure: true },
  );

  const output = result.stdout + '\n' + result.stderr;
  return {
    status: result.exitCode === 0 ? 'passed' : 'failed',
    durationMs: Date.now() - startMs,
    output,
    errors: result.exitCode !== 0 ? extractErrors(output) : [],
  };
}

export const testRunTool = {
  name: 'test_run',
  description:
    'Run a specific test by number, automatically resolving its dependencies. ' +
    'Returns a compact summary with pass/fail and error lines only — no full logs. ' +
    'Use test_log to fetch full output for a specific test if needed.',
  inputSchema: z.object({
    test: z.coerce.number().int().min(1).describe('Test number to run (e.g. 11 for plugin-lifecycle)'),
    suite: z
      .enum(['single-vm', 'three-vm'])
      .default('three-vm')
      .describe('Which test suite'),
    skipDeps: z
      .coerce.boolean()
      .default(false)
      .describe(
        'Skip dependency tests (use if you know prerequisites are met, e.g. from a snapshot)',
      ),
  }),
  async handler({ test, suite, skipDeps } = {}) {
    suite = suite || 'three-vm';
    skipDeps = skipDeps ?? false;
    const state = loadState();

    // Resolve test chain
    const chain = resolveTestChain(test, suite);
    const testsToRun = skipDeps ? chain.filter((t) => t.number === test) : chain;

    const env = await buildTestEnv(state);

    // Create run
    const run = createRun();
    const startMs = Date.now();
    const testResults = [];

    for (const { number, file } of testsToRun) {
      const testName = file.replace('.sh', '');

      // Reset Authelia between tests
      if (suite === 'three-vm') {
        await resetAuthelia();
      }

      const result =
        suite === 'three-vm'
          ? await runThreeVmTest(file, env)
          : await runSingleVmTest(file);

      const testEntry = {
        number,
        name: testName,
        status: result.status,
        durationMs: result.durationMs,
        errors: result.errors,
      };

      testResults.push(testEntry);
      writeTestResult(run.testsDir, testName, testEntry);
      writeTestLog(run.logsDir, testName, result.output);

      // Stop on failure
      if (result.status === 'failed') break;
    }

    return finishRun(run, suite, test, testResults, startMs);
  },
};

export const testRunAllTool = {
  name: 'test_run_all',
  description:
    'Run all tests in a suite (single-vm, three-vm, or both). ' +
    'Returns a compact summary — errors only for failed tests.',
  inputSchema: z.object({
    suite: z
      .enum(['single-vm', 'three-vm', 'both'])
      .default('both')
      .describe('Which suite(s) to run'),
  }),
  async handler({ suite } = {}) {
    suite = suite || 'both';
    const state = loadState();
    const run = createRun();
    const startMs = Date.now();
    const allResults = [];

    const env = await buildTestEnv(state);

    // Single-VM tests
    if (suite === 'single-vm' || suite === 'both') {
      // Transfer single-VM test scripts to host
      await mp.exec(VM_HOST, 'mkdir -p /tmp/e2e-single && chmod 777 /tmp/e2e-single', { sudo: true });
      const files = fs.readdirSync(SINGLE_VM_DIR).filter((f) => f.endsWith('.sh'));
      // Transfer sequentially to avoid overwhelming the VM's SSH daemon
      for (const file of files) {
        await mp.transfer(
          path.join(SINGLE_VM_DIR, file),
          `${VM_HOST}:/tmp/e2e-single/${file}`,
        );
      }

      for (const [, file] of Object.entries(getSingleVmTests()).sort(
        ([a], [b]) => Number(a) - Number(b),
      )) {
        const testName = `single-${file.replace('.sh', '')}`;
        const result = await runSingleVmTest(file);
        const entry = {
          name: testName,
          status: result.status,
          durationMs: result.durationMs,
          errors: result.errors,
        };
        allResults.push(entry);
        writeTestResult(run.testsDir, testName, entry);
        writeTestLog(run.logsDir, testName, result.output);
      }
    }

    // Three-VM tests
    if (suite === 'three-vm' || suite === 'both') {
      for (const [, file] of Object.entries(getThreeVmTests()).sort(
        ([a], [b]) => Number(a) - Number(b),
      )) {
        const testName = `three-${file.replace('.sh', '')}`;
        await resetAuthelia();
        const result = await runThreeVmTest(file, env);
        const entry = {
          name: testName,
          status: result.status,
          durationMs: result.durationMs,
          errors: result.errors,
        };
        allResults.push(entry);
        writeTestResult(run.testsDir, testName, entry);
        writeTestLog(run.logsDir, testName, result.output);
      }
    }

    return finishRun(run, suite, 'all', allResults, startMs);
  },
};

export const testListTool = {
  name: 'test_list',
  description:
    'List all available tests with their dependency graph and filenames.',
  inputSchema: z.object({
    suite: z
      .enum(['single-vm', 'three-vm', 'both'])
      .default('both')
      .describe('Which suite(s) to list'),
  }),
  async handler({ suite } = {}) {
    const s = suite || 'both';
    const result = {};

    if (s === 'single-vm' || s === 'both') {
      result.singleVm = Object.entries(getSingleVmTests())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, file]) => ({
          number: Number(num),
          file,
          deps: SINGLE_VM_DEPS[Number(num)] || [],
        }));
    }

    if (s === 'three-vm' || s === 'both') {
      result.threeVm = Object.entries(getThreeVmTests())
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([num, file]) => ({
          number: Number(num),
          file,
          deps: THREE_VM_DEPS[Number(num)] || [],
        }));
    }

    return {
      content: [
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  },
};

export const testResetTool = {
  name: 'test_reset',
  description:
    'Reset shared state between tests without reprovisioning. ' +
    'Clears Authelia regulation state, kills stray processes, deletes test tunnels.',
  inputSchema: z.object({}),
  async handler() {
    const steps = [];

    // Reset Authelia
    await resetAuthelia();
    steps.push('Authelia regulation state cleared');

    // Kill stray processes on agent in parallel
    await Promise.all([
      mp.exec(VM_AGENT, 'pkill -f "python3 -m http.server" || true', {
        sudo: true,
        allowFailure: true,
      }),
      mp.exec(VM_AGENT, 'pkill -f chisel || true', {
        sudo: true,
        allowFailure: true,
      }),
    ]);
    steps.push('Killed stray HTTP servers and chisel clients on agent');

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, steps }, null, 2),
        },
      ],
    };
  },
};

export const testPublishTool = {
  name: 'test_publish',
  description:
    'Run the full E2E suite with production-profile VMs and write rich Markdown logs ' +
    'to e2e-logs/ for committing. This is the final gate before shipping — enforces ' +
    '512MB/1CPU production profile. VMs must be created with production profile and ' +
    'provisioned first, then call with skipRecreate=true.',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
    skipRecreate: z
      .coerce.boolean()
      .default(false)
      .describe(
        'Skip VM recreation (use if VMs are already running with production profile)',
      ),
  }),
  async handler({ domain, skipRecreate } = {}) {
    domain = domain || TEST_DOMAIN;
    skipRecreate = skipRecreate ?? false;
    const steps = [];

    if (!skipRecreate) {
      steps.push(
        'Note: test_publish enforces production profile (512M/1CPU). ' +
        'VMs should be created with vm_create({ profile: "production" }) first, ' +
        'then fully provisioned. Pass skipRecreate=true once ready.',
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ok: false,
                error:
                  'Production VMs not confirmed. Create VMs with production profile, ' +
                  'provision them, then call test_publish with skipRecreate=true.',
                steps,
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    // Run the full orchestrator and capture markdown output
    steps.push('Running full E2E suite via orchestrate.sh...');

    const state = loadState();
    const env = await buildTestEnv(state);

    // Use the existing orchestrate.sh with --skip-create --skip-setup
    // since VMs are already provisioned
    try {
      const result = await execa(
        'bash',
        [
          path.join(THREE_VM_DIR, 'orchestrate.sh'),
          '--skip-create',
          '--skip-setup',
          '--domain',
          domain,
        ],
        {
          cwd: REPO_ROOT,
          timeout: 600_000,
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            HOST_IP: env.HOST_IP,
            AGENT_IP: env.AGENT_IP,
            VISITOR_IP: env.VISITOR_IP,
            TEST_DOMAIN: env.TEST_DOMAIN,
            AGENT_P12_PASSWORD: state.credentials?.agentP12Password || 'not-used-enrollment-flow',
          },
          all: true,
        },
      );

      steps.push('Full suite completed');
      steps.push(`Logs written to ${E2E_LOGS_DIR}/`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { ok: true, logsDir: E2E_LOGS_DIR, steps },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      const output = err.all || err.stderr || err.message;
      steps.push('Suite had failures');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ok: false,
                steps,
                errors: extractErrors(output),
                logsDir: E2E_LOGS_DIR,
              },
              null,
              2,
            ),
          },
        ],
      };
    }
  },
};
