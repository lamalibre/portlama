import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { Listr } from 'listr2';
import chalk from 'chalk';
import { assertSupportedPlatform, AGENT_DIR, SERVICE_CONFIG_PATH, isLinux } from '../lib/platform.js';
import { isAgentLoaded, unloadAgent } from '../lib/service.js';

/**
 * Unload the agent, remove the service config, chisel binary, and config.
 */
export async function runUninstall() {
  assertSupportedPlatform();

  const tasks = new Listr(
    [
      {
        title: 'Unloading agent',
        skip: async () => {
          const loaded = await isAgentLoaded();
          return !loaded && 'Agent not loaded';
        },
        task: async () => {
          await unloadAgent();
        },
      },
      {
        title: 'Removing service config',
        skip: () => !existsSync(SERVICE_CONFIG_PATH) && 'Service config not found',
        task: async () => {
          await rm(SERVICE_CONFIG_PATH);
          if (isLinux()) {
            const { execa } = await import('execa');
            await execa('systemctl', ['daemon-reload']);
          }
        },
      },
      {
        title: 'Removing ~/.portlama directory',
        skip: () => !existsSync(AGENT_DIR) && 'Directory not found',
        task: async () => {
          await rm(AGENT_DIR, { recursive: true });
        },
      },
    ],
    {
      renderer: 'default',
      rendererOptions: { collapseSubtasks: false },
      exitOnError: true,
    },
  );

  await tasks.run();

  console.log('');
  console.log(chalk.green('  Portlama Agent uninstalled successfully.'));
  console.log(chalk.dim('  All agent files have been removed.'));
  console.log('');
}
