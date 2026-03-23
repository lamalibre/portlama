// ============================================================================
// Interactive Installer
// ============================================================================
// Detects the portlama repo, checks prerequisites, and configures Claude Code
// to use the e2e-mcp server via `claude mcp add`.
//
// Usage: npx @lamalibre/install-portlama-e2e-mcp
//
// Steps:
//   1. Detect portlama repository root
//   2. Verify prerequisites (multipass, node >= 20, claude CLI)
//   3. Install npm dependencies
//   4. Verify MCP server loads
//   5. Register MCP server via `claude mcp add`

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Listr } from 'listr2';
import { execa } from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Find portlama repo root by walking up from cwd or package location. */
function findRepoRoot() {
  // First try: walk up from cwd
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (
      fs.existsSync(path.join(dir, 'CLAUDE.md')) &&
      fs.existsSync(path.join(dir, 'packages', 'panel-server'))
    ) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  // Second try: relative to this package (when installed in the monorepo)
  const candidate = path.resolve(__dirname, '..', '..', '..');
  if (
    fs.existsSync(path.join(candidate, 'CLAUDE.md')) &&
    fs.existsSync(path.join(candidate, 'packages', 'panel-server'))
  ) {
    return candidate;
  }

  return null;
}

export async function install() {
  console.log('');
  console.log(
    chalk.bold.cyan(
      '  ┌─────────────────────────────────────────────┐',
    ),
  );
  console.log(
    chalk.bold.cyan(
      '  │     Portlama E2E MCP Server Installer       │',
    ),
  );
  console.log(
    chalk.bold.cyan(
      '  └─────────────────────────────────────────────┘',
    ),
  );
  console.log('');

  const ctx = {
    repoRoot: null,
    serverPath: null,
    multipassVersion: null,
    nodeVersion: null,
    claudeVersion: null,
  };

  const tasks = new Listr(
    [
      {
        title: 'Detecting portlama repository',
        task: async (_ctx, task) => {
          ctx.repoRoot = findRepoRoot();
          if (!ctx.repoRoot) {
            throw new Error(
              'Could not find portlama repository. Run this from within the repo, ' +
                'or clone it first: git clone https://github.com/lamalibre/portlama.git',
            );
          }
          ctx.serverPath = path.join(
            ctx.repoRoot,
            'packages',
            'install-portlama-e2e-mcp',
            'src',
            'index.js',
          );
          task.output = ctx.repoRoot;
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Checking Node.js version',
        task: async (_ctx, task) => {
          const version = process.version;
          const major = parseInt(version.slice(1).split('.')[0], 10);
          if (major < 20) {
            throw new Error(
              `Node.js >= 20 required (found ${version}). Install via nvm or nodejs.org.`,
            );
          }
          ctx.nodeVersion = version;
          task.output = version;
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Checking Multipass installation',
        task: async (_ctx, task) => {
          try {
            const { stdout } = await execa('multipass', ['version']);
            ctx.multipassVersion = stdout.split('\n')[0];
            task.output = ctx.multipassVersion;
          } catch {
            throw new Error(
              'Multipass is not installed. Install it from https://multipass.run',
            );
          }
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Checking Claude Code CLI',
        task: async (_ctx, task) => {
          try {
            const { stdout } = await execa('claude', ['--version']);
            ctx.claudeVersion = stdout.trim();
            task.output = ctx.claudeVersion;
          } catch {
            throw new Error(
              'Claude Code CLI not found. Install it from https://claude.com/claude-code',
            );
          }
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Installing dependencies',
        task: async (_ctx, task) => {
          const e2eMcpDir = path.join(
            ctx.repoRoot,
            'packages',
            'install-portlama-e2e-mcp',
          );
          if (!fs.existsSync(e2eMcpDir)) {
            throw new Error(
              `e2e-mcp package not found at ${e2eMcpDir}. ` +
                'Make sure you have the latest version of the repo.',
            );
          }

          // Check if node_modules already exists
          if (
            fs.existsSync(path.join(e2eMcpDir, 'node_modules')) ||
            fs.existsSync(path.join(ctx.repoRoot, 'node_modules'))
          ) {
            task.output = 'Already installed (workspace)';
            return;
          }

          task.output = 'Running npm install...';
          await execa('npm', ['install'], { cwd: ctx.repoRoot });
          task.output = 'Done';
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Verifying MCP server loads',
        task: async (_ctx, task) => {
          const configPath = path.join(
            ctx.repoRoot,
            'packages',
            'install-portlama-e2e-mcp',
            'src',
            'config.js',
          );
          await execa('node', [
            '-e',
            `import('${configPath.replace(/\\/g, '\\\\')}').then(() => console.log('OK'))`,
          ]);
          task.output = 'Server modules load correctly';
        },
        rendererOptions: { persistentOutput: true },
      },
      {
        title: 'Registering MCP server with Claude Code',
        task: async (_ctx, task) => {
          // Remove existing server if present (idempotent reinstall)
          await execa('claude', ['mcp', 'remove', 'e2e'], {
            reject: false,
          });

          // Register via claude mcp add
          await execa('claude', [
            'mcp', 'add',
            '--transport', 'stdio',
            'e2e',
            '--',
            'node', ctx.serverPath,
          ]);

          task.output = 'Registered as "e2e" MCP server';
        },
        rendererOptions: { persistentOutput: true },
      },
    ],
    {
      renderer: 'default',
      rendererOptions: { collapseSubtasks: false },
      exitOnError: true,
    },
  );

  try {
    await tasks.run();

    console.log('');
    console.log(chalk.green.bold('  Installation complete!'));
    console.log('');
    console.log(
      chalk.dim('  The following tools are now available in Claude Code:'),
    );
    console.log('');
    console.log('  ' + chalk.cyan('env_detect') + '          — detect hardware, recommend VM profile');
    console.log('  ' + chalk.cyan('vm_create') + '           — create VMs with resource profile');
    console.log('  ' + chalk.cyan('vm_list') + '             — list running VMs');
    console.log('  ' + chalk.cyan('vm_delete') + '           — tear down VMs');
    console.log('  ' + chalk.cyan('vm_exec') + '             — execute command on a VM');
    console.log('  ' + chalk.cyan('snapshot_create') + '     — snapshot VMs at checkpoint');
    console.log('  ' + chalk.cyan('snapshot_restore') + '    — restore VMs to checkpoint');
    console.log('  ' + chalk.cyan('snapshot_list') + '       — list available snapshots');
    console.log('  ' + chalk.cyan('provision_host') + '      — full host provisioning');
    console.log('  ' + chalk.cyan('provision_agent') + '     — agent setup with cert transfer');
    console.log('  ' + chalk.cyan('provision_visitor') + '   — visitor setup');
    console.log('  ' + chalk.cyan('hot_reload') + '          — re-deploy a single package');
    console.log('  ' + chalk.cyan('test_run') + '            — run a test with dependency resolution');
    console.log('  ' + chalk.cyan('test_run_all') + '        — run full test suite');
    console.log('  ' + chalk.cyan('test_list') + '           — list tests with dependency graph');
    console.log('  ' + chalk.cyan('test_reset') + '          — reset state between tests');
    console.log('  ' + chalk.cyan('test_publish') + '        — production run with markdown logs');
    console.log('  ' + chalk.cyan('env_status') + '          — environment health check');
    console.log('  ' + chalk.cyan('test_log') + '            — fetch raw log for debugging');
    console.log('');
    console.log(chalk.dim('  Restart Claude Code to activate the MCP server.'));
    console.log('');
  } catch (err) {
    console.log('');
    console.error(chalk.red(`  Installation failed: ${err.message}`));
    console.log('');
    process.exit(1);
  }
}
