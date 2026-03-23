#!/usr/bin/env node
// ============================================================================
// e2e-mcp — Dual-mode entry point
// ============================================================================
// Interactive (TTY):  Install mode — configures Claude Code MCP settings
// Piped (stdio):      Server mode — runs as MCP server
//
// Usage:
//   npx @lamalibre/install-portlama-e2e-mcp              # install & configure
//   npx @lamalibre/install-portlama-e2e-mcp --install    # force install mode
//   npx @lamalibre/install-portlama-e2e-mcp --server     # force server mode
// ============================================================================

const args = process.argv.slice(2);
const forceInstall = args.includes('--install');
const forceServer = args.includes('--server');

try {
  if (forceServer) {
    await import('../src/index.js');
  } else if (forceInstall || process.stdin.isTTY) {
    const { install } = await import('../src/install.js');
    await install();
  } else {
    await import('../src/index.js');
  }
} catch (error) {
  console.error(`\n  Error: ${error.message}\n`);
  process.exit(1);
}
