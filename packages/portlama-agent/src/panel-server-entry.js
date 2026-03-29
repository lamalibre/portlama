#!/usr/bin/env node

/**
 * Standalone entry point for the agent panel HTTP server.
 *
 * Executed by launchd/systemd as a separate service from chisel.
 * Parses --label and --port from command-line arguments.
 *
 * Usage: node panel-server-entry.js --label my-agent --port 9393
 */

import { startPanelServer } from './lib/panel-server.js';

function parseArgs(argv) {
  const args = argv.slice(2);
  let label = null;
  let port = 9393;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--label' && i + 1 < args.length) {
      label = args[++i];
    } else if (args[i] === '--port' && i + 1 < args.length) {
      const parsed = parseInt(args[++i], 10);
      if (!Number.isNaN(parsed) && parsed >= 1024 && parsed <= 65535) {
        port = parsed;
      }
    }
  }

  return { label, port };
}

const { label, port } = parseArgs(process.argv);

if (!label) {
  process.stderr.write('Error: --label is required\n');
  process.exit(1);
}

try {
  await startPanelServer(label, { port });
} catch (err) {
  process.stderr.write(`Failed to start panel server: ${err.message}\n`);
  process.exit(1);
}
