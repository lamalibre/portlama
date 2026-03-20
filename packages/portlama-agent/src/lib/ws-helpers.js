import { mkdir } from 'node:fs/promises';
import { chmod } from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';
import { AGENT_DIR } from './platform.js';

/**
 * Load the p12 certificate as PEM files for the ws library.
 * Converts the p12 to temporary PEM cert + key files using openssl.
 * @param {string} p12Path
 * @param {string} p12Password
 * @returns {Promise<{ certPath: string, keyPath: string, caPath: string | null }>}
 */
export async function extractPemFromP12(p12Path, p12Password) {
  const pemDir = path.join(AGENT_DIR, '.pem');
  await mkdir(pemDir, { recursive: true });

  const certPath = path.join(pemDir, 'client-cert.pem');
  const keyPath = path.join(pemDir, 'client-key.pem');

  // Extract certificate
  await execa('openssl', [
    'pkcs12',
    '-in',
    p12Path,
    '-clcerts',
    '-nokeys',
    '-out',
    certPath,
    '-passin',
    `pass:${p12Password}`,
    '-legacy',
  ]);

  // Extract private key
  await execa('openssl', [
    'pkcs12',
    '-in',
    p12Path,
    '-nocerts',
    '-nodes',
    '-out',
    keyPath,
    '-passin',
    `pass:${p12Password}`,
    '-legacy',
  ]);

  // Restrict private key file permissions to owner-only read/write
  await chmod(keyPath, 0o600);

  return { certPath, keyPath, caPath: null };
}

/**
 * Build WebSocket URL from panel URL.
 * Converts https:// to wss:// and http:// to ws://.
 * @param {string} panelUrl
 * @param {string} wsPath
 * @returns {string}
 */
export function buildWsUrl(panelUrl, wsPath) {
  return panelUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + wsPath;
}
