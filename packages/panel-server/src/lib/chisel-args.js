/**
 * Build the Chisel client argument array from tunnel list and domain.
 *
 * Used by both the mac-plist endpoint (to generate plist XML) and the
 * agent-config endpoint (to return raw args for any platform).
 *
 * @param {Array<{ port: number }>} tunnels - Enabled tunnels
 * @param {string} domain - Base domain (e.g., "example.com")
 * @returns {string[]} Chisel client argument array
 */
export function buildChiselArgs(tunnels, domain) {
  const args = [
    'client',
    '--tls-skip-verify',
    `https://tunnel.${domain}:443`,
  ];

  for (const tunnel of tunnels) {
    args.push(`R:127.0.0.1:${tunnel.port}:127.0.0.1:${tunnel.port}`);
  }

  return args;
}
