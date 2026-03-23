// ============================================================================
// Snapshot Tools — snapshot_create, snapshot_restore, snapshot_list
// ============================================================================

import { z } from 'zod';
import * as mp from '../lib/multipass.js';
import { ALL_VMS, VM_NAME_MAP, CHECKPOINTS } from '../config.js';

export const snapshotCreateTool = {
  name: 'snapshot_create',
  description:
    'Create a named snapshot of one or all VMs. Use checkpoint names like ' +
    '"post-create" or "post-setup" for standard save-points, or any custom name.',
  inputSchema: z.object({
    name: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/).describe('Snapshot name (e.g. "post-setup", "before-plugin-fix")'),
    vms: z
      .array(z.enum(['host', 'agent', 'visitor']))
      .optional()
      .describe('Which VMs to snapshot (default: all three)'),
  }),
  async handler({ name, vms } = {}) {
    const targets = vms ? vms.map((v) => VM_NAME_MAP[v]) : ALL_VMS;
    const results = [];

    // Stop all VMs in parallel (required for snapshots)
    await Promise.all(targets.map((vm) => mp.run(['stop', vm], { allowFailure: true })));
    results.push(`Stopped ${targets.length} VMs`);

    // Snapshot all VMs in parallel
    await Promise.all(targets.map((vm) => mp.snapshot(vm, name)));
    results.push(`Created snapshot "${name}" on ${targets.length} VMs`);

    // Restart all VMs in parallel
    await Promise.all(
      targets.map(async (vm) => {
        await mp.run(['start', vm], { timeout: 600_000 });
        results.push(`${vm}: restarted`);
      }),
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, snapshots: results }, null, 2),
        },
      ],
    };
  },
};

export const snapshotRestoreTool = {
  name: 'snapshot_restore',
  description:
    'Restore one or all VMs to a named snapshot. This resets the VM to the ' +
    'exact state when the snapshot was taken — much faster than reprovisioning.',
  inputSchema: z.object({
    name: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/).describe('Snapshot name to restore'),
    vms: z
      .array(z.enum(['host', 'agent', 'visitor']))
      .optional()
      .describe('Which VMs to restore (default: all three)'),
  }),
  async handler({ name, vms } = {}) {
    const targets = vms ? vms.map((v) => VM_NAME_MAP[v]) : ALL_VMS;
    const results = [];

    // Stop all VMs in parallel
    await Promise.all(targets.map((vm) => mp.run(['stop', vm], { allowFailure: true })));

    // Restore all VMs in parallel
    await Promise.all(
      targets.map(async (vm) => {
        await mp.restore(vm, name);
        results.push(`${vm}: restored to "${name}"`);
      }),
    );

    // Restart all VMs in parallel (graceful error handling)
    await Promise.all(
      targets.map(async (vm) => {
        try {
          await mp.run(['start', vm], { timeout: 600_000 });
          results.push(`${vm}: restarted`);
        } catch (err) {
          results.push(`${vm}: start failed (${err.message}) — may need manual start`);
        }
      }),
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ ok: true, restored: results }, null, 2),
        },
      ],
    };
  },
};

export const snapshotListTool = {
  name: 'snapshot_list',
  description: 'List all available snapshots across VMs, plus known checkpoint descriptions.',
  inputSchema: z.object({}),
  async handler() {
    // Query all VMs in parallel
    const entries = await Promise.all(
      ALL_VMS.map(async (vmName) => [vmName, await mp.listSnapshots(vmName)]),
    );
    const snapshots = Object.fromEntries(entries.filter(([, snaps]) => snaps.length > 0));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { snapshots, checkpoints: CHECKPOINTS },
            null,
            2,
          ),
        },
      ],
    };
  },
};
