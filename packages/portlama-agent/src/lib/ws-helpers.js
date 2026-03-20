import { readFileSync, existsSync } from 'node:fs';
import { mkdir, chmod } from 'node:fs/promises';
import path from 'node:path';
import { execa } from 'execa';
import { AGENT_DIR } from './platform.js';

/** Default path where the panel CA certificate is stored. */
export const CA_CERT_PATH = path.join(AGENT_DIR, 'ca.crt');

/**
 * Load the p12 certificate as PEM files for the ws library.
 * Converts the p12 to temporary PEM cert + key files using openssl,
 * and also extracts the CA certificate for TLS verification.
 * @param {string} p12Path
 * @param {string} p12Password
 * @returns {Promise<{ certPath: string, keyPath: string, caPath: string | null }>}
 */
export async function extractPemFromP12(p12Path, p12Password) {
  const pemDir = path.join(AGENT_DIR, '.pem');
  await mkdir(pemDir, { recursive: true });

  const certPath = path.join(pemDir, 'client-cert.pem');
  const keyPath = path.join(pemDir, 'client-key.pem');

  // Pass the P12 password via environment variable instead of command-line
  // argument to prevent it from being visible in `ps aux` process listings.
  const opensslEnv = { ...process.env, PORTLAMA_P12_PASS: p12Password };

  // Extract client certificate
  await execa(
    'openssl',
    [
      'pkcs12',
      '-in',
      p12Path,
      '-clcerts',
      '-nokeys',
      '-out',
      certPath,
      '-passin',
      'env:PORTLAMA_P12_PASS',
      '-legacy',
    ],
    { env: opensslEnv },
  );

  // Extract private key
  await execa(
    'openssl',
    [
      'pkcs12',
      '-in',
      p12Path,
      '-nocerts',
      '-nodes',
      '-out',
      keyPath,
      '-passin',
      'env:PORTLAMA_P12_PASS',
      '-legacy',
    ],
    { env: opensslEnv },
  );

  // Restrict private key file permissions to owner-only read/write
  await chmod(keyPath, 0o600);

  // Extract CA certificate from the P12 bundle
  let caPath = null;
  try {
    await execa(
      'openssl',
      [
        'pkcs12',
        '-in',
        p12Path,
        '-cacerts',
        '-nokeys',
        '-out',
        CA_CERT_PATH,
        '-passin',
        'env:PORTLAMA_P12_PASS',
        '-legacy',
      ],
      { env: opensslEnv },
    );
    // Verify the file was actually created and is non-empty
    if (
      existsSync(CA_CERT_PATH) &&
      readFileSync(CA_CERT_PATH, 'utf8').includes('BEGIN CERTIFICATE')
    ) {
      await chmod(CA_CERT_PATH, 0o644);
      caPath = CA_CERT_PATH;
    }
  } catch {
    // CA cert may not be present in the P12 — that is acceptable.
    // The caller will fall back to insecure mode with a warning.
  }

  return { certPath, keyPath, caPath };
}

/**
 * Build TLS options for a WebSocket connection using the extracted PEM files.
 * Uses the CA certificate for server verification when available, otherwise
 * falls back to rejectUnauthorized: false with a warning to stderr.
 * @param {{ certPath: string, keyPath: string, caPath: string | null }} pem
 * @returns {{ cert: Buffer, key: Buffer, ca?: Buffer, rejectUnauthorized: boolean }}
 */
export function buildWsTlsOptions(pem) {
  const cert = readFileSync(pem.certPath);
  const key = readFileSync(pem.keyPath);

  // Prefer the caPath from the PEM extraction, fall back to the well-known location
  const effectiveCaPath = pem.caPath || (existsSync(CA_CERT_PATH) ? CA_CERT_PATH : null);

  if (effectiveCaPath) {
    return {
      cert,
      key,
      ca: readFileSync(effectiveCaPath),
      rejectUnauthorized: true,
    };
  }

  process.stderr.write(
    'WARNING: CA certificate not found at ' +
      CA_CERT_PATH +
      '. TLS server verification is disabled. ' +
      'Re-run "portlama-agent setup" to extract the CA certificate from your P12.\n',
  );
  return {
    cert,
    key,
    rejectUnauthorized: false,
  };
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
