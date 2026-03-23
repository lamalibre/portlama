// ============================================================================
// Status & Log Inspection Tools — env_status, test_log
// ============================================================================

import { z } from 'zod';
import * as mp from '../lib/multipass.js';
import { loadState } from '../lib/state.js';
import { readTestLog, readSummary, listRuns } from '../lib/logs.js';
import { ALL_VMS, VM_HOST } from '../config.js';

export const envStatusTool = {
  name: 'env_status',
  description:
    'Full environment health check: are VMs running? Are services up? ' +
    'What profile are they using? Are there snapshots available? ' +
    'What was the last test run result?',
  inputSchema: z.object({}),
  async handler() {
    const state = loadState();

    // Query VM info and snapshots in parallel
    const [vmInfos, snapshotEntries] = await Promise.all([
      Promise.all(ALL_VMS.map(async (vmName) => [vmName, await mp.info(vmName)])),
      Promise.all(ALL_VMS.map(async (vmName) => [vmName, await mp.listSnapshots(vmName)])),
    ]);

    // Build VM status map
    const vms = {};
    for (const [vmName, info] of vmInfos) {
      if (info?.info?.[vmName]) {
        const vmInfo = info.info[vmName];
        vms[vmName] = {
          state: vmInfo.state,
          ipv4: vmInfo.ipv4?.[0] || null,
          cpus: vmInfo.cpu_count,
          memory: vmInfo.memory?.total
            ? `${Math.round(vmInfo.memory.total / (1024 * 1024))}M`
            : null,
          disk: vmInfo.disk?.total
            ? `${Math.round(vmInfo.disk.total / (1024 * 1024 * 1024))}G`
            : null,
        };
      } else {
        vms[vmName] = { state: 'not-found' };
      }
    }

    // Check services on host in parallel (if running)
    let services = null;
    if (vms[VM_HOST]?.state === 'Running') {
      const serviceNames = ['portlama-panel', 'nginx', 'authelia', 'chisel-server'];
      const serviceResults = await Promise.all(
        serviceNames.map(async (svc) => {
          const result = await mp.exec(VM_HOST, `systemctl is-active ${svc} 2>/dev/null | head -1`, {
            sudo: true,
            allowFailure: true,
          });
          return [svc, result.stdout.trim() || 'unknown'];
        }),
      );
      services = Object.fromEntries(serviceResults);
    }

    // Build snapshots map
    const snapshots = Object.fromEntries(snapshotEntries.filter(([, snaps]) => snaps.length > 0));

    // Last run
    const runs = listRuns();
    let lastRun = null;
    if (runs.length > 0) {
      lastRun = readSummary(runs[0]);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              vms,
              profile: state.profile,
              domain: state.domain,
              services,
              snapshots: Object.keys(snapshots).length > 0 ? snapshots : null,
              lastRun: lastRun
                ? {
                    id: lastRun.runId,
                    passed: lastRun.passed,
                    failed: lastRun.failed,
                    durationMs: lastRun.durationMs,
                  }
                : null,
              hasCredentials: !!state.credentials,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};

export const testLogTool = {
  name: 'test_log',
  description:
    'Fetch the full raw log output for a specific test from an intermediate run. ' +
    'Use this after test_run shows a failure and you need the complete output to debug.',
  inputSchema: z.object({
    testName: z
      .string()
      .describe(
        'Test name (e.g. "01-onboarding-complete", "11-plugin-lifecycle")',
      ),
    runId: z
      .string()
      .optional()
      .describe('Run ID (default: most recent run)'),
  }),
  async handler({ testName, runId } = {}) {
    const targetRunId = runId || listRuns()[0];
    if (!targetRunId) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: 'No test runs found',
            }),
          },
        ],
      };
    }

    const log = readTestLog(targetRunId, testName);
    if (!log) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: `No log found for test "${testName}" in run "${targetRunId}"`,
              availableRuns: listRuns().slice(0, 5),
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: log,
        },
      ],
    };
  },
};
