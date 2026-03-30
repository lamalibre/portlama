// ============================================================================
// Snapshot Tools — snapshot_create, snapshot_restore, snapshot_list
// ============================================================================

import { z } from 'zod';
import * as mp from '../lib/multipass.js';
import {
  ALL_VMS,
  VM_NAME_MAP,
  CHECKPOINTS,
  TIERS,
  TIER_SNAPSHOT_PREFIX,
} from '../config.js';
import {
  loadState,
  setVmTier,
  recordTierSnapshot,
} from '../lib/state.js';

export const snapshotCreateTool = {
  name: 'snapshot_create',
  description:
    'Create a named snapshot of one or all VMs. Use checkpoint names like ' +
    '"post-create" or "post-setup" for standard save-points, a tier name for ' +
    'tier snapshots, or any custom name.',
  inputSchema: z.object({
    name: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
      .optional()
      .describe('Snapshot name (e.g. "post-setup", "before-plugin-fix"). Required unless tier is set.'),
    tier: z
      .enum(['node-ready', 'installed', 'provisioned'])
      .optional()
      .describe('Tier name — auto-generates snapshot name as "tier-<tierName>" and records in state'),
    vms: z
      .array(z.enum(['host', 'agent', 'visitor']))
      .optional()
      .describe('Which VMs to snapshot (default: all three)'),
  }),
  async handler({ name, tier, vms } = {}) {
    if (!name && !tier) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: false, error: 'Either "name" or "tier" must be provided' }, null, 2),
        }],
      };
    }

    const snapshotName = tier ? TIER_SNAPSHOT_PREFIX + tier : name;
    const targets = vms ? vms.map((v) => VM_NAME_MAP[v]) : ALL_VMS;
    const results = [];

    // Delete existing snapshot if overwriting a tier
    if (tier) {
      for (const vm of targets) {
        const existing = await mp.listSnapshots(vm);
        if (existing.includes(snapshotName)) {
          await mp.deleteSnapshot(vm, snapshotName);
          results.push(`${vm}: deleted existing "${snapshotName}"`);
        }
      }
    }

    // Stop all VMs in parallel (required for snapshots)
    await Promise.all(targets.map((vm) => mp.run(['stop', vm], { allowFailure: true })));
    results.push(`Stopped ${targets.length} VMs`);

    // Snapshot all VMs in parallel
    await Promise.all(targets.map((vm) => mp.snapshot(vm, snapshotName)));
    results.push(`Created snapshot "${snapshotName}" on ${targets.length} VMs`);

    // Restart all VMs in parallel
    await Promise.all(
      targets.map(async (vm) => {
        await mp.run(['start', vm], { timeout: 600_000 });
        results.push(`${vm}: restarted`);
      }),
    );

    // Record tier snapshot in state
    if (tier) {
      recordTierSnapshot(tier, targets);
      results.push(`Recorded tier "${tier}" in state`);
    }

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
    'exact state when the snapshot was taken — much faster than reprovisioning. ' +
    'Use "tier" param for tier-aware restores that update VM tier state.',
  inputSchema: z.object({
    name: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/)
      .optional()
      .describe('Snapshot name to restore. Required unless tier is set.'),
    tier: z
      .enum(['node-ready', 'installed', 'provisioned'])
      .optional()
      .describe('Tier name — uses "tier-<tierName>" as snapshot name and updates VM tier state'),
    vms: z
      .array(z.enum(['host', 'agent', 'visitor']))
      .optional()
      .describe('Which VMs to restore (default: all three)'),
  }),
  async handler({ name, tier, vms } = {}) {
    if (!name && !tier) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: false, error: 'Either "name" or "tier" must be provided' }, null, 2),
        }],
      };
    }

    const snapshotName = tier ? TIER_SNAPSHOT_PREFIX + tier : name;
    const targets = vms ? vms.map((v) => VM_NAME_MAP[v]) : ALL_VMS;
    const results = [];

    // Stop all VMs in parallel
    await Promise.all(targets.map((vm) => mp.run(['stop', vm], { allowFailure: true })));

    // Restore all VMs in parallel
    await Promise.all(
      targets.map(async (vm) => {
        await mp.restore(vm, snapshotName);
        results.push(`${vm}: restored to "${snapshotName}"`);
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

    // Update tier state after restore
    if (tier) {
      for (const vm of targets) {
        setVmTier(vm, tier);
      }
      results.push(`Updated tier state to "${tier}" for ${targets.length} VMs`);
    }

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
  description: 'List all available snapshots across VMs, plus known checkpoint descriptions and tier state.',
  inputSchema: z.object({}),
  async handler() {
    const state = loadState();

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
            {
              snapshots,
              checkpoints: CHECKPOINTS,
              tierSnapshots: state.tierSnapshots || {},
              currentTiers: state.tiers || {},
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};
