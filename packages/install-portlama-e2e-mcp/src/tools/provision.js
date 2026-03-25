// ============================================================================
// Provisioning Tools — provision_host, provision_agent, provision_visitor, hot_reload
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
  REPO_ROOT,
  THREE_VM_DIR,
  TEST_DOMAIN,
} from '../config.js';
import { loadState, updateState, setVmState } from '../lib/state.js';

/** Pack a workspace package and return the tarball path. */
async function packPackage(packageName) {
  const pkgDir = path.join(REPO_ROOT, 'packages', packageName);
  const result = await execa('npm', ['pack', '--pack-destination', '/tmp'], {
    cwd: pkgDir,
  });
  const tarballName = result.stdout.trim().split('\n').pop();
  return `/tmp/${tarballName}`;
}

/** Transfer test scripts to a VM. */
async function transferTestScripts(vmName) {
  await mp.exec(vmName, 'mkdir -p /tmp/e2e && chmod 777 /tmp/e2e', { sudo: true });

  const files = fs.readdirSync(THREE_VM_DIR).filter((f) => f.endsWith('.sh'));
  await Promise.all(
    files.map((file) =>
      mp.transfer(path.join(THREE_VM_DIR, file), `${vmName}:/tmp/e2e/${file}`),
    ),
  );

  // Transfer VM-side API helpers in parallel
  const helpers = ['vm-api-helper.sh', 'vm-api-status-helper.sh'];
  await Promise.all(
    helpers.map(async (helper) => {
      const helperPath = path.join(THREE_VM_DIR, helper);
      try {
        await mp.transfer(helperPath, `${vmName}:/tmp/${helper}`);
        await mp.exec(vmName, `chmod +x /tmp/${helper}`, { sudo: true });
      } catch {
        // Helper may not exist
      }
    }),
  );
}

export const provisionHostTool = {
  name: 'provision_host',
  description:
    'Pack create-portlama, transfer to host VM, install, and run setup. ' +
    'This is the full provisioning pipeline for the host VM.',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
  }),
  async handler({ domain } = {}) {
    domain = domain || TEST_DOMAIN;
    const steps = [];

    // 1. Pack installer
    const tarball = await packPackage('create-portlama');
    steps.push(`Packed installer: ${tarball}`);

    // 2. Ensure npm is available (NodeSource images ship with Node+npm)
    const npmCheck = await mp.exec(VM_HOST, 'npm --version', { allowFailure: true });
    if (npmCheck.exitCode !== 0) {
      await mp.exec(VM_HOST, 'apt-get update', {
        sudo: true,
        timeout: 120_000,
      });
      await mp.exec(VM_HOST, 'apt-get install -y npm', {
        sudo: true,
        timeout: 120_000,
      });
      steps.push('npm installed on host');
    } else {
      steps.push(`npm already available (v${npmCheck.stdout.trim()})`);
    }

    // 3. Transfer and install
    await mp.transfer(tarball, `${VM_HOST}:/tmp/create-portlama.tgz`);
    await mp.exec(VM_HOST, 'npm install -g /tmp/create-portlama.tgz', {
      sudo: true,
      timeout: 120_000,
    });
    steps.push('create-portlama installed');

    // 4. Run installer
    await mp.exec(VM_HOST, 'create-portlama --dev --skip-harden --yes', {
      sudo: true,
      timeout: 300_000,
    });
    steps.push('Portlama installed');

    // 5. Transfer test scripts and run setup
    await transferTestScripts(VM_HOST);
    const hostIp = await mp.getIp(VM_HOST);

    const setupResult = await mp.exec(
      VM_HOST,
      `bash /tmp/e2e/setup-host.sh "${hostIp}" "${domain}"`,
      { sudo: true, timeout: 180_000, allowFailure: true },
    );

    const ok = setupResult.exitCode === 0;
    steps.push(ok ? 'setup-host.sh completed' : `setup-host.sh failed (exit ${setupResult.exitCode})`);

    // 6. Extract credentials
    const credsResult = await mp.exec(
      VM_HOST,
      'cat /tmp/portlama-test-credentials.json',
      { sudo: true, allowFailure: true },
    );

    let credentials = null;
    if (credsResult.exitCode === 0) {
      try {
        credentials = JSON.parse(credsResult.stdout);
        updateState({ credentials, domain });
        steps.push('Credentials extracted');
      } catch {
        steps.push('Warning: could not parse credentials');
      }
    }

    setVmState(VM_HOST, { provisioned: ok, domain });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              ok,
              steps,
              ...(ok ? {} : { error: setupResult.stderr.slice(-500) }),
            },
            null,
            2,
          ),
        },
      ],
    };
  },
};

export const provisionAgentTool = {
  name: 'provision_agent',
  description:
    'Transfer agent certificate and run setup on the agent VM. ' +
    'Requires host to be provisioned first (needs credentials).',
  inputSchema: z.object({
    domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9.-]+$/).default(TEST_DOMAIN).describe('Test domain'),
  }),
  async handler({ domain } = {}) {
    domain = domain || TEST_DOMAIN;
    const state = loadState();
    const agentP12Password = state.credentials?.agentP12Password;
    if (!agentP12Password) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: false,
              error: 'No agent P12 password in state — run provision_host first',
            }),
          },
        ],
      };
    }

    const steps = [];
    const hostIp = await mp.getIp(VM_HOST);

    // Transfer P12 from host to agent
    await mp.exec(
      VM_HOST,
      'cp /etc/portlama/pki/agents/test-agent/client.p12 /tmp/agent-export.p12 && chmod 644 /tmp/agent-export.p12',
      { sudo: true },
    );
    const tmpP12 = `/tmp/portlama-agent-${Date.now()}`;
    try {
      await mp.transferFrom(`${VM_HOST}:/tmp/agent-export.p12`, tmpP12);
      await mp.transfer(tmpP12, `${VM_AGENT}:/tmp/agent.p12`);
      steps.push('Agent P12 transferred');
    } finally {
      // Clean up temp P12 from host machine
      try { fs.unlinkSync(tmpP12); } catch { /* may not exist */ }
    }

    // Transfer test scripts
    await transferTestScripts(VM_AGENT);

    // Transfer P12 password via file to avoid process listing exposure
    const tmpPassFile = `/tmp/.portlama-p12-pass-${Date.now()}`;
    try {
      fs.writeFileSync(tmpPassFile, agentP12Password, { mode: 0o600 });
      await mp.transfer(tmpPassFile, `${VM_AGENT}:/tmp/.agent-p12-pass`);
    } finally {
      try { fs.unlinkSync(tmpPassFile); } catch { /* may not exist */ }
    }
    await mp.exec(VM_AGENT, 'chmod 600 /tmp/.agent-p12-pass', { sudo: true });

    // Run setup — reads password from file via $3
    const result = await mp.exec(
      VM_AGENT,
      `bash /tmp/e2e/setup-agent.sh "${hostIp}" "${domain}" "$(cat /tmp/.agent-p12-pass)"`,
      { sudo: true, timeout: 120_000, allowFailure: true },
    );

    // Clean up password file inside VM
    await mp.exec(VM_AGENT, 'rm -f /tmp/.agent-p12-pass', { sudo: true, allowFailure: true });

    const ok = result.exitCode === 0;
    steps.push(ok ? 'setup-agent.sh completed' : `setup-agent.sh failed (exit ${result.exitCode})`);
    setVmState(VM_AGENT, { provisioned: ok });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { ok, steps, ...(ok ? {} : { error: result.stderr.slice(-500) }) },
            null,
            2,
          ),
        },
      ],
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
    const steps = [];
    const hostIp = await mp.getIp(VM_HOST);

    await transferTestScripts(VM_VISITOR);

    const result = await mp.exec(
      VM_VISITOR,
      `bash /tmp/e2e/setup-visitor.sh "${hostIp}" "${domain}"`,
      { sudo: true, timeout: 120_000, allowFailure: true },
    );

    const ok = result.exitCode === 0;
    steps.push(ok ? 'setup-visitor.sh completed' : `setup-visitor.sh failed (exit ${result.exitCode})`);
    setVmState(VM_VISITOR, { provisioned: ok });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { ok, steps, ...(ok ? {} : { error: result.stderr.slice(-500) }) },
            null,
            2,
          ),
        },
      ],
    };
  },
};

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
