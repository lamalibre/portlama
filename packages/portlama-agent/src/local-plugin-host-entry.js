#!/usr/bin/env node

/**
 * Standalone entry point for the local plugin host Fastify server.
 *
 * Executed by launchd/systemd as a user-level service.
 * Parses --port from command-line arguments.
 *
 * Usage: node local-plugin-host-entry.js [--port 9293]
 */

import { startLocalPluginHost } from './lib/local-plugin-host.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  let port = 9293;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!Number.isNaN(parsed) && parsed >= 1024 && parsed <= 65535) {
        port = parsed;
      }
    }
  }

  return { port };
}

const { port } = parseArgs(process.argv);

try {
  await startLocalPluginHost({ port });
} catch (err) {
  process.stderr.write(`Failed to start local plugin host: ${err.message}\n`);
  process.exit(1);
}
