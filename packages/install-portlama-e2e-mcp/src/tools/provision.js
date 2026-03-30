// ============================================================================
// Provisioning Tools — provision, provision_host, provision_agent,
//                      provision_visitor, hot_reload
// ============================================================================

import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import { execa } from 'execa';
import * as mp from '../lib/multipass.js';
import {
  VM_HOST,
  VM_AGENT,
  VM_VISITOR,
  ALL_VMS,
  REPO_ROOT,
  THREE_VM_DIR,
  TEST_DOMAIN,
  VM_NAME_MAP,
  VM_STATIC_IPS,
  TIERS,
  TIER_SNAPSHOT_PREFIX,
} from '../config.js';
import {
  loadState,
  updateState,
  setVmState,
  setVmTier,
  getVmTier,
  recordTierSnapshot,
  hasTierSnapshot,
} from '../lib/state.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pack a workspace package and return the tarball path. */
async function packPackage(packageName) {
  const pkgDir = path.join(REPO_ROOT, 'packages', packageName);
  const result = await execa('npm', ['pack', '--pack-destination', '/tmp'], {
    cwd: pkgDir,
  });
  const tarballName = result.stdout.trim().split('\n').pop();
  return `/tmp/${tarballName}`;
}

/** Transfer test scripts to a VM (sequential to avoid SSH overload). */
async function transferTestScripts(vmName) {
  await mp.exec(vmName, 'mkdir -p /tmp/e2e && chmod 777 /tmp/e2e', { sudo: true });

  const files = fs.readdirSync(THREE_VM_DIR).filter((f) => f.endsWith('.sh'));
  for (const file of files) {
    await mp.transfer(path.join(THREE_VM_DIR, file), `${vmName}:/tmp/e2e/${file}`);
  }

  const helpers = ['vm-api-helper.sh', 'vm-api-status-helper.sh'];
  for (const helper of helpers) {
    const helperPath = path.join(THREE_VM_DIR, helper);
    try {
      await mp.transfer(helperPath, `${vmName}:/tmp/${helper}`);
      await mp.exec(vmName, `chmod +x /tmp/${helper}`, { sudo: true });
    } catch {
      // Helper may not exist
    }
  }
}

// ---------------------------------------------------------------------------
// Stage functions (internal — called by provisionTool and legacy tools)
// ---------------------------------------------------------------------------

/** Stage 1: Install Node.js 22.x on a VM via NodeSource. */
async function stageInstallNode(vmName) {
  const npmCheck = await mp.exec(vmName, 'npm --version', { allowFailure: true });
  if (npmCheck.exitCode === 0) {
    return { skipped: true, message: `npm already available (v${npmCheck.stdout.trim()})` };
  }
  await mp.exec(vmName, 'apt-get update', { sudo: true, timeout: 180_000 });
  await mp.exec(vmName, 'apt-get install -y ca-certificates curl gnupg', {
    sudo: true,
    timeout: 180_000,
  });
  await mp.exec(
    vmName,
    'curl -fsSL https://deb.nodesource.com/setup_22.x | bash -',
    { sudo: true, timeout: 300_000 },
  );
  await mp.exec(vmName, 'apt-get install -y nodejs', {
    sudo: true,
    timeout: 180_000,
  });
  return { skipped: false, message: 'Node.js 22.x installed via NodeSource' };
}

/** Stage 2: Pack, transfer, install, and run create-portlama on host. */
async function stageInstallPortlama() {
  const tarball = await packPackage('create-portlama');
  await mp.transfer(tarball, `${VM_HOST}:/tmp/create-portlama.tgz`);
  await mp.exec(VM_HOST, 'npm install -g /tmp/create-portlama.tgz', {
    sudo: true,
    timeout: 120_000,
  });
  await mp.exec(VM_HOST, 'create-portlama --dev --skip-harden --yes', {
    sudo: true,
    timeout: 300_000,
  });

  // Patch panel.json to use the static IP instead of the DHCP IP that
  // create-portlama auto-detected. The static IP is what dnsmasq resolves to
  // and what agents/visitors use for connectivity.
  const staticIp = VM_STATIC_IPS[VM_HOST];
  if (staticIp) {
    await mp.exec(
      VM_HOST,
      `sed -i 's/"ip": *"[^"]*"/"ip": "${staticIp}"/' /etc/portlama/panel.json`,
      { sudo: true, timeout: 10_000 },
    );
    // Restart panel server to pick up the new IP
    await mp.exec(VM_HOST, 'systemctl restart portlama-panel', {
      sudo: true,
      timeout: 15_000,
      allowFailure: true,
    });
  }

  return { message: 'create-portlama installed and executed' };
}

/** Stage 3a: Run setup-host.sh (onboarding, certs, user creation). */
async function stageSetupHost(domain) {
  await transferTestScripts(VM_HOST);
  const hostIp = VM_STATIC_IPS[VM_HOST] || await mp.getIp(VM_HOST);

  const setupResult = await mp.exec(
    VM_HOST,
    `bash /tmp/e2e/setup-host.sh "${hostIp}" "${domain}"`,
    { sudo: true, timeout: 180_000, allowFailure: true },
  );

  const ok = setupResult.exitCode === 0;
  let credentials = null;

  if (ok) {
    const credsResult = await mp.exec(
      VM_HOST,
      'cat /tmp/portlama-test-credentials.json',
      { sudo: true, allowFailure: true },
    );
    if (credsResult.exitCode === 0) {
      try {
        credentials = JSON.parse(credsResult.stdout);
      } catch {
        // Parse failure handled by caller
      }
    }
  }

  return { ok, credentials, error: ok ? null : setupResult.stderr.slice(-500) };
}

/** Stage 3b: Pack agent, transfer tarball + enrollment token, run setup-agent.sh. */
async function stageSetupAgent(domain, enrollmentToken) {
  const hostIp = VM_STATIC_IPS[VM_HOST] || await mp.getIp(VM_HOST);

  // Pack and transfer portlama-agent tarball
  const agentTarball = await packPackage('portlama-agent');
  await mp.transfer(agentTarball, `${VM_AGENT}:/tmp/portlama-agent.tgz`);

  await transferTestScripts(VM_AGENT);

  // Transfer enrollment token via file (never in process args)
  const tmpTokenFile = `/tmp/.portlama-enroll-token-${Date.now()}`;
  try {
    fs.writeFileSync(tmpTokenFile, enrollmentToken, { mode: 0o600 });
    await mp.transfer(tmpTokenFile, `${VM_AGENT}:/tmp/.enroll-token`);
  } finally {
    try { fs.unlinkSync(tmpTokenFile); } catch { /* may not exist */ }
  }
  await mp.exec(VM_AGENT, 'chmod 600 /tmp/.enroll-token', { sudo: true });

  const result = await mp.exec(
    VM_AGENT,
    `bash /tmp/e2e/setup-agent.sh "${hostIp}" "${domain}" "$(cat /tmp/.enroll-token)"`,
    { sudo: true, timeout: 180_000, allowFailure: true },
  );

  await mp.exec(VM_AGENT, 'rm -f /tmp/.enroll-token', { sudo: true, allowFailure: true });

  return { ok: result.exitCode === 0, error: result.exitCode === 0 ? null : result.stderr.slice(-500) };
}

/** Stage 3c: Transfer scripts and run setup-visitor.sh. */
async function stageSetupVisitor(domain) {
  const hostIp = VM_STATIC_IPS[VM_HOST] || await mp.getIp(VM_HOST);
  await transferTestScripts(VM_VISITOR);

  const result = await mp.exec(
    VM_VISITOR,
    `bash /tmp/e2e/setup-visitor.sh "${hostIp}" "${domain}"`,
    { sudo: true, timeout: 120_000, allowFailure: true },
  );

  return { ok: result.exitCode === 0, error: result.exitCode === 0 ? null : result.stderr.slice(-500) };
}

// ---------------------------------------------------------------------------
// Tier snapshot helpers
// ---------------------------------------------------------------------------

/** Create a tier snapshot for the given VMs. Stops, snapshots, restarts. */
async function createTierSnapshot(tierName, vmNames) {
  const snapshotName = TIER_SNAPSHOT_PREFIX + tierName;

  // Delete existing tier snapshot if present (overwrite)
  for (const vm of vmNames) {
    const existing = await mp.listSnapshots(vm);
    if (existing.includes(snapshotName)) {
      await mp.deleteSnapshot(vm, snapshotName);
    }
  }

  await Promise.all(vmNames.map((vm) => mp.run(['stop', vm], { allowFailure: true })));
  await Promise.all(vmNames.map((vm) => mp.snapshot(vm, snapshotName)));
  await Promise.all(vmNames.map((vm) => mp.run(['start', vm], { timeout: 600_000 })));

  recordTierSnapshot(tierName, vmNames);
}

/** Restore VMs to a tier snapshot. Stops, restores, restarts. */
async function restoreTierSnapshot(tierName, vmNames) {
  const snapshotName = TIER_SNAPSHOT_PREFIX + tierName;

  await Promise.all(vmNames.map((vm) => mp.run(['stop', vm], { allowFailure: true })));
  await Promise.all(vmNames.map((vm) => mp.restore(vm, snapshotName)));
  await Promise.all(vmNames.map((vm) => mp.run(['start', vm], { timeout: 600_000 })));

  for (const vm of vmNames) {
    setVmTier(vm, tierName);
  }
}

// ---------------------------------------------------------------------------
// Smart provisioning tool
// ---------------------------------------------------------------------------

export const provisionTool = {
  name: 'provision',
  description:
    'Smart provisioning with layered snapshots. Restores from cached tier snapshots ' +
    'when possible, only runs stages that are needed. Auto-snapshots after each tier ' +
    'for fast future restores. Tiers: node-ready -> installed -> provisioned.',
  inputSchema: z.object({
    targetTier: z
      .enum(['node-ready', 'installed', 'provisioned'])
      .default('provisioned')
      .describe('Target tier to reach'),
    domain: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/)
      .default(TEST_DOMAIN)
      .describe('Test domain'),
    skipSnapshots: z.coerce
      .boolean()
      .default(false)
      .describe('Skip auto-snapshotting after each tier (faster but no cache)'),
    forceReprovision: z.coerce
      .boolean()
      .default(false)
      .describe('Ignore existing snapshots and reprovision from scratch'),
  }),
  async handler({ targetTier, domain, skipSnapshots, forceReprovision } = {}) {
    targetTier = targetTier || 'provisioned';
    domain = domain || TEST_DOMAIN;
    const steps = [];
    const targetLevel = TIERS[targetTier].level;

    try {
      // --- TIER 1: node-ready ---
      if (targetLevel >= 1) {
        const tier = 'node-ready';
        const tierDef = TIERS[tier];
        // Determine which VMs need Node.js (all that apply for the final target)
        const targetVms = targetLevel >= 3
          ? tierDef.appliesTo.map((v) => VM_NAME_MAP[v])
          : [VM_HOST];

        const canRestore = !forceReprovision && hasTierSnapshot(tier, targetVms);
        if (canRestore) {
          await restoreTierSnapshot(tier, targetVms);
          steps.push(`Restored tier "${tier}" from snapshot (${targetVms.length} VMs)`);
        } else {
          // Install Node.js on each VM that needs it
          for (const vm of targetVms) {
            const currentTier = getVmTier(vm);
            const currentLevel = currentTier ? (TIERS[currentTier]?.level || 0) : 0;
            if (currentLevel >= 1) {
              steps.push(`${vm}: already at tier "${currentTier}" — skipping Node.js install`);
            } else {
              const result = await stageInstallNode(vm);
              steps.push(`${vm}: ${result.message}`);
              setVmTier(vm, tier);
            }
          }

          if (!skipSnapshots) {
            await createTierSnapshot(tier, targetVms);
            steps.push(`Snapshot "${TIER_SNAPSHOT_PREFIX}${tier}" created (${targetVms.length} VMs)`);
          }
        }
      }

      // --- TIER 2: installed (host only) ---
      if (targetLevel >= 2) {
        const tier = 'installed';
        const targetVms = [VM_HOST];

        const canRestore = !forceReprovision && hasTierSnapshot(tier, targetVms);
        if (canRestore) {
          await restoreTierSnapshot(tier, targetVms);
          steps.push(`Restored tier "${tier}" from snapshot`);
        } else {
          const currentTier = getVmTier(VM_HOST);
          const currentLevel = currentTier ? (TIERS[currentTier]?.level || 0) : 0;
          if (currentLevel >= 2) {
            steps.push(`Host already at tier "${currentTier}" — skipping Portlama install`);
          } else {
            const result = await stageInstallPortlama();
            steps.push(`Host: ${result.message}`);
            setVmTier(VM_HOST, tier);
          }

          if (!skipSnapshots) {
            await createTierSnapshot(tier, targetVms);
            steps.push(`Snapshot "${TIER_SNAPSHOT_PREFIX}${tier}" created`);
          }
        }
      }

      // --- TIER 3: provisioned (coordinated) ---
      if (targetLevel >= 3) {
        const tier = 'provisioned';
        const targetVms = ALL_VMS;

        const canRestore = !forceReprovision && hasTierSnapshot(tier, targetVms);
        if (canRestore) {
          await restoreTierSnapshot(tier, targetVms);
          // Restore credentials from state (they survive in state.json)
          steps.push(`Restored tier "${tier}" from snapshot (all 3 VMs)`);
        } else {
          // 3a: Setup host
          const hostResult = await stageSetupHost(domain);
          if (!hostResult.ok) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  ok: false,
                  steps: [...steps, 'setup-host.sh failed'],
                  error: hostResult.error,
                }, null, 2),
              }],
            };
          }

          if (hostResult.credentials) {
            updateState({ credentials: hostResult.credentials, domain });
          }
          setVmState(VM_HOST, { provisioned: true, domain });
          setVmTier(VM_HOST, tier);
          steps.push('Host: setup completed, credentials extracted');

          // 3b + 3c: Setup agent and visitor in parallel
          const enrollmentToken = hostResult.credentials?.enrollmentToken;
          if (!enrollmentToken) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  ok: false,
                  steps: [...steps, 'No enrollment token in credentials'],
                  error: 'Credentials extraction failed',
                }, null, 2),
              }],
            };
          }

          const [agentResult, visitorResult] = await Promise.all([
            stageSetupAgent(domain, enrollmentToken),
            stageSetupVisitor(domain),
          ]);

          setVmState(VM_AGENT, { provisioned: agentResult.ok });
          setVmState(VM_VISITOR, { provisioned: visitorResult.ok });

          if (agentResult.ok) {
            setVmTier(VM_AGENT, tier);
            steps.push('Agent: setup completed');
          } else {
            steps.push(`Agent: setup failed — ${agentResult.error}`);
          }

          if (visitorResult.ok) {
            setVmTier(VM_VISITOR, tier);
            steps.push('Visitor: setup completed');
          } else {
            steps.push(`Visitor: setup failed — ${visitorResult.error}`);
          }

          const allOk = agentResult.ok && visitorResult.ok;
          if (allOk && !skipSnapshots) {
            await createTierSnapshot(tier, targetVms);
            steps.push(`Snapshot "${TIER_SNAPSHOT_PREFIX}${tier}" created (all 3 VMs)`);
          }

          if (!allOk) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({ ok: false, targetTier, steps }, null, 2),
              }],
            };
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ok: true, targetTier, steps }, null, 2),
        }],
      };
    } catch (err) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ok: false,
            targetTier,
            steps,
            error: err.message,
          }, null, 2),
        }],
      };
    }
  },
};

// ---------------------------------------------------------------------------
// Legacy provisioning tools (delegate to stage functions)
// ---------------------------------------------------------------------------

export const provisionHostTool = {
  name: 'provision_host',
  description:
    'Pack create-portlama, transfer to host VM, install, and run setup. ' +
    'Consider using "provision" instead for tier-aware smart provisioning.',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
  }),
  async handler({ domain } = {}) {
    domain = domain || TEST_DOMAIN;
    const steps = [];

    const nodeResult = await stageInstallNode(VM_HOST);
    steps.push(`Node.js: ${nodeResult.message}`);
    setVmTier(VM_HOST, 'node-ready');

    const installResult = await stageInstallPortlama();
    steps.push(installResult.message);
    setVmTier(VM_HOST, 'installed');

    const setupResult = await stageSetupHost(domain);
    steps.push(setupResult.ok ? 'setup-host.sh completed' : 'setup-host.sh failed');

    if (setupResult.credentials) {
      updateState({ credentials: setupResult.credentials, domain });
      steps.push('Credentials extracted');
    }

    setVmState(VM_HOST, { provisioned: setupResult.ok, domain });
    if (setupResult.ok) setVmTier(VM_HOST, 'provisioned');

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ok: setupResult.ok,
          steps,
          ...(setupResult.ok ? {} : { error: setupResult.error }),
        }, null, 2),
      }],
    };
  },
};

export const provisionAgentTool = {
  name: 'provision_agent',
  description:
    'Transfer agent tarball and run enrollment on the agent VM. ' +
    'Requires host to be provisioned first (needs enrollment token).',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
  }),
  async handler({ domain } = {}) {
    domain = domain || TEST_DOMAIN;
    const state = loadState();
    const enrollmentToken = state.credentials?.enrollmentToken;
    if (!enrollmentToken) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ok: false,
            error: 'No enrollment token in state — run provision_host first',
          }),
        }],
      };
    }

    const result = await stageSetupAgent(domain, enrollmentToken);
    setVmState(VM_AGENT, { provisioned: result.ok });
    if (result.ok) setVmTier(VM_AGENT, 'provisioned');

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ok: result.ok,
          steps: [result.ok ? 'setup-agent.sh completed' : 'setup-agent.sh failed'],
          ...(result.ok ? {} : { error: result.error }),
        }, null, 2),
      }],
    };
  },
};

export const provisionVisitorTool = {
  name: 'provision_visitor',
  description: 'Run setup on the visitor VM. Requires host to be provisioned.',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
  }),
  async handler({ domain } = {}) {
    domain = domain || TEST_DOMAIN;

    const result = await stageSetupVisitor(domain);
    setVmState(VM_VISITOR, { provisioned: result.ok });
    if (result.ok) setVmTier(VM_VISITOR, 'provisioned');

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ok: result.ok,
          steps: [result.ok ? 'setup-visitor.sh completed' : 'setup-visitor.sh failed'],
          ...(result.ok ? {} : { error: result.error }),
        }, null, 2),
      }],
    };
  },
};

// ---------------------------------------------------------------------------
// Hot reload tool (unchanged)
// ---------------------------------------------------------------------------

export const hotReloadTool = {
  name: 'hot_reload',
  description:
    'Re-pack a specific workspace package, transfer it to the host VM, and restart ' +
    'the relevant service. Much faster than full reprovisioning — use during iteration.',
  inputSchema: z.object({
    package: z
      .enum([
        'panel-server',
        'panel-client',
        'create-portlama',
        'portlama-agent',
      ])
      .describe('Which package to reload'),
  }),
  async handler({ package: pkgName }) {
    const steps = [];

    try {
      // Build the package first
      await execa('npm', ['run', 'build', '-w', `packages/${pkgName}`], {
        cwd: REPO_ROOT,
      });
      steps.push(`Built ${pkgName}`);

      // Pack it
      const tarball = await packPackage(pkgName);
      steps.push(`Packed: ${tarball}`);

      // Transfer to host
      const remotePath = `/tmp/${pkgName}.tgz`;
      await mp.transfer(tarball, `${VM_HOST}:${remotePath}`);
      steps.push('Transferred to host');

      // Install on host
      await mp.exec(VM_HOST, `npm install -g ${remotePath}`, {
        sudo: true,
        timeout: 60_000,
      });
      steps.push('Installed on host');

      // Restart relevant service
      const serviceMap = {
        'panel-server': 'portlama-panel',
        'panel-client': null, // static files, no service
        'create-portlama': null, // installer, no service
        'portlama-agent': null, // runs on agent VM, not host
      };

      const service = serviceMap[pkgName];
      if (service) {
        await mp.exec(VM_HOST, `systemctl restart ${service}`, { sudo: true });
        await mp.exec(VM_HOST, `sleep 2 && systemctl is-active ${service}`, {
          sudo: true,
          allowFailure: true,
        });
        steps.push(`Restarted ${service}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ok: true, package: pkgName, steps }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { ok: false, package: pkgName, steps, error: err.message },
              null,
              2,
            ),
          },
        ],
      };
    }
  },
};
