import crypto from 'node:crypto';
import { access, constants, readFile, writeFile, unlink } from 'node:fs/promises';
import { execa } from 'execa';
import {
  readCertExpiry,
  loadAgentRegistry,
  saveAgentRegistry,
  withRegistryLock,
} from './mtls.js';

const PKI_DIR = process.env.PORTLAMA_PKI_DIR || '/etc/portlama/pki';
const AGENTS_DIR = `${PKI_DIR}/agents`;

/**
 * Read the serial from the current admin client cert.
 * Returns empty string if the cert doesn't exist or can't be read.
 *
 * @returns {Promise<string>}
 */
async function readAdminCertSerial() {
  try {
    const { stdout } = await execa('sudo', [
      'openssl',
      'x509',
      '-in',
      `${PKI_DIR}/client.crt`,
      '-serial',
      '-noout',
    ]);
    const match = stdout.match(/serial=([A-Fa-f0-9]+)/);
    return match ? match[1] : '';
  } catch {
    return '';
  }
}

/**
 * Sign an admin CSR with the panel CA for hardware-bound admin upgrade.
 *
 * Signs the CSR with the correct admin subject (/CN=admin/O=Portlama),
 * reads serial and expiry. Does NOT modify the registry (admin is not
 * tracked in the agent registry).
 *
 * @param {string} csrPem - PEM-encoded CSR
 * @param {import('pino').Logger} logger
 * @returns {Promise<{ certPem: string, caCertPem: string, serial: string, expiresAt: string, oldSerial: string }>}
 */
export async function signAdminCSR(csrPem, logger) {
  // Reject oversized CSRs (a 4096-bit RSA CSR is ~1600 bytes PEM)
  if (csrPem.length > 8192) {
    throw Object.assign(new Error('CSR too large'), { statusCode: 400 });
  }

  // Verify CA key exists
  try {
    await access(`${PKI_DIR}/ca.key`, constants.R_OK);
  } catch {
    try {
      await execa('sudo', ['test', '-r', `${PKI_DIR}/ca.key`]);
    } catch {
      throw Object.assign(new Error('CA key not found — cannot sign certificate'), {
        statusCode: 500,
      });
    }
  }

  // Read the current admin cert serial for revocation
  const oldSerial = await readAdminCertSerial();

  const tmpSuffix = crypto.randomBytes(8).toString('hex');
  const csrPath = `${PKI_DIR}/.admin-csr-${tmpSuffix}.pem`;
  const certPath = `${PKI_DIR}/.admin-cert-${tmpSuffix}.pem`;

  try {
    // Write the CSR to a temp file
    await writeFile(csrPath, csrPem, { mode: 0o600 });

    // Validate CSR structure and signature before signing
    try {
      await execa('openssl', ['req', '-verify', '-in', csrPath, '-noout']);
    } catch {
      throw Object.assign(
        new Error('Invalid CSR: structure or signature verification failed'),
        { statusCode: 400 },
      );
    }

    // Sign the CSR with the CA (2-year validity), forcing admin subject
    logger.info('Signing admin CSR for hardware-bound upgrade');
    await execa('sudo', [
      'openssl',
      'x509',
      '-req',
      '-in',
      csrPath,
      '-CA',
      `${PKI_DIR}/ca.crt`,
      '-CAkey',
      `${PKI_DIR}/ca.key`,
      '-CAcreateserial',
      '-out',
      certPath,
      '-days',
      '730',
      '-sha256',
      '-subj',
      '/CN=admin/O=Portlama',
    ]);

    // Make the signed cert readable by the portlama service user
    await execa('sudo', ['chown', 'portlama:portlama', certPath]);
    await execa('sudo', ['chmod', '644', certPath]);

    // Read the serial number
    const { stdout: serialOut } = await execa('openssl', [
      'x509',
      '-in',
      certPath,
      '-serial',
      '-noout',
    ]);
    const serialMatch = serialOut.match(/serial=([A-Fa-f0-9]+)/);
    const serial = serialMatch ? serialMatch[1] : '';

    // Read expiry
    const expiry = await readCertExpiry(certPath);
    const expiresAt = expiry?.expiresAt || new Date(Date.now() + 730 * 86400000).toISOString();

    // Read the signed certificate PEM
    const certPem = await readFile(certPath, 'utf-8');

    // Update server-side client.crt so reset-admin can read the correct serial
    await writeFile(`${PKI_DIR}/client.crt`, certPem, { mode: 0o644 });

    // Read the CA certificate PEM (with sudo fallback for permission safety)
    let caCertPem;
    try {
      caCertPem = await readFile(`${PKI_DIR}/ca.crt`, 'utf-8');
    } catch {
      const { stdout } = await execa('sudo', ['cat', `${PKI_DIR}/ca.crt`]);
      caCertPem = stdout;
    }

    logger.info({ serial }, 'Admin CSR signed for hardware-bound upgrade');

    return { certPem, caCertPem, serial, expiresAt, oldSerial };
  } finally {
    // Clean up temp files (portlama now owns these after chown)
    await unlink(csrPath).catch(() => {});
    await unlink(certPath).catch(() => {});
    await execa('sudo', ['rm', '-f', `${PKI_DIR}/ca.srl`]).catch(() => {});
  }
}

/**
 * Rotate an agent's certificate via CSR for hardware-bound upgrade.
 *
 * Signs a new CSR for an existing agent, revokes the old certificate,
 * preserves capabilities and allowed sites, and sets enrollmentMethod
 * to 'hardware-bound'.
 *
 * @param {string} csrPem - PEM-encoded CSR
 * @param {string} label - Agent label (must match an existing non-revoked agent)
 * @param {import('pino').Logger} logger
 * @returns {Promise<{ certPem: string, caCertPem: string, serial: string, expiresAt: string, label: string }>}
 */
export async function rotateAgentCSR(csrPem, label, logger) {
  // Defense-in-depth: re-validate label for DN safety
  if (!/^[a-z0-9][a-z0-9-]*$/.test(label) || label.length > 50) {
    throw Object.assign(new Error('Invalid agent label'), { statusCode: 400 });
  }

  if (csrPem.length > 8192) {
    throw Object.assign(new Error('CSR too large'), { statusCode: 400 });
  }

  return withRegistryLock(async () => {
    // Find the existing non-revoked agent entry
    const registry = await loadAgentRegistry();
    const existing = registry.agents.find((a) => a.label === label && !a.revoked);
    if (!existing) {
      throw Object.assign(new Error(`Agent certificate "${label}" not found`), {
        statusCode: 404,
      });
    }

    // Verify CA key exists
    try {
      await access(`${PKI_DIR}/ca.key`, constants.R_OK);
    } catch {
      try {
        await execa('sudo', ['test', '-r', `${PKI_DIR}/ca.key`]);
      } catch {
        throw Object.assign(new Error('CA key not found — cannot sign certificate'), {
          statusCode: 500,
        });
      }
    }

    const tmpSuffix = crypto.randomBytes(8).toString('hex');
    const csrPath = `${AGENTS_DIR}/.rotate-csr-${tmpSuffix}.pem`;
    const certPath = `${AGENTS_DIR}/.rotate-cert-${tmpSuffix}.pem`;

    try {
      // Write the CSR to a temp file
      await writeFile(csrPath, csrPem, { mode: 0o600 });

      // Validate CSR structure and signature
      try {
        await execa('openssl', ['req', '-verify', '-in', csrPath, '-noout']);
      } catch {
        throw Object.assign(
          new Error('Invalid CSR: structure or signature verification failed'),
          { statusCode: 400 },
        );
      }

      // Sign the CSR with the CA (2-year validity)
      logger.info({ label }, 'Signing rotation CSR for hardware-bound upgrade');
      await execa('sudo', [
        'openssl',
        'x509',
        '-req',
        '-in',
        csrPath,
        '-CA',
        `${PKI_DIR}/ca.crt`,
        '-CAkey',
        `${PKI_DIR}/ca.key`,
        '-CAcreateserial',
        '-out',
        certPath,
        '-days',
        '730',
        '-sha256',
        '-subj',
        `/CN=agent:${label}/O=Portlama`,
      ]);

      // Make cert readable
      await execa('sudo', ['chown', 'portlama:portlama', certPath]);
      await execa('sudo', ['chmod', '644', certPath]);

      // Read the serial number
      const { stdout: serialOut } = await execa('openssl', [
        'x509',
        '-in',
        certPath,
        '-serial',
        '-noout',
      ]);
      const serialMatch = serialOut.match(/serial=([A-Fa-f0-9]+)/);
      const serial = serialMatch ? serialMatch[1] : '';

      // Read expiry
      const expiry = await readCertExpiry(certPath);
      const expiresAt = expiry?.expiresAt || new Date(Date.now() + 730 * 86400000).toISOString();

      // Read the signed certificate PEM
      const certPem = await readFile(certPath, 'utf-8');

      // Read the CA certificate PEM
      let caCertPem;
      try {
        caCertPem = await readFile(`${PKI_DIR}/ca.crt`, 'utf-8');
      } catch {
        const { stdout } = await execa('sudo', ['cat', `${PKI_DIR}/ca.crt`]);
        caCertPem = stdout;
      }

      // Revoke the old certificate
      const { addToRevocationList } = await import('./revocation.js');
      logger.info({ label, oldSerial: existing.serial }, 'Revoking old agent certificate for hardware-bound upgrade');
      await addToRevocationList(existing.serial, `agent:${label} (upgraded to hardware-bound)`);

      // Update the existing registry entry atomically: new serial, new expiry,
      // mark as hardware-bound, preserve capabilities and allowedSites
      existing.serial = serial;
      existing.expiresAt = expiresAt;
      existing.enrollmentMethod = 'hardware-bound';
      existing.revoked = false;
      await saveAgentRegistry(registry);

      logger.info({ label, serial }, 'Agent certificate rotated for hardware-bound upgrade');

      return { certPem, caCertPem, serial, expiresAt, label };
    } finally {
      await unlink(csrPath).catch(() => {});
      await unlink(certPath).catch(() => {});
      await execa('sudo', ['rm', '-f', `${PKI_DIR}/ca.srl`]).catch(() => {});
    }
  });
}

/**
 * Sign an externally-generated CSR with the panel CA.
 *
 * Validates that the CSR subject matches the expected agent CN format,
 * signs it with the CA (2-year validity), reads serial and expiry,
 * and adds the agent to the registry with `enrollmentMethod: 'hardware-bound'`.
 *
 * For delegated enrollments, uses the `plugin-agent:<delegatingLabel>:<pluginAgentLabel>`
 * CN format and stores the registry entry with `enrollmentType: 'delegated'` and
 * `delegatedBy` field.
 *
 * @param {string} csrPem - PEM-encoded CSR
 * @param {string} label - Agent label (must match CSR subject)
 * @param {string[]} capabilities - Capability list
 * @param {string[]} allowedSites - Allowed site labels
 * @param {import('pino').Logger} logger
 * @param {{ type?: 'delegated', delegatedBy?: string }} [opts] - Optional enrollment metadata
 * @returns {Promise<{ certPem: string, caCertPem: string, serial: string, expiresAt: string, label: string }>}
 */
export async function signCSR(csrPem, label, capabilities, allowedSites, logger, opts) {
  const isDelegated = opts?.type === 'delegated';

  // Defense-in-depth: re-validate label for DN safety even though routes validate via Zod.
  // For delegated enrollments, the label is "plugin-agent:<delegating>:<plugin>" — validate each segment.
  if (isDelegated) {
    const match = label.match(/^plugin-agent:([a-z0-9][a-z0-9-]*):([a-z0-9][a-z0-9-]*)$/);
    if (!match || label.length > 150) {
      throw Object.assign(new Error('Invalid plugin-agent label'), { statusCode: 400 });
    }
  } else if (!/^[a-z0-9][a-z0-9-]*$/.test(label) || label.length > 50) {
    throw Object.assign(new Error('Invalid agent label'), { statusCode: 400 });
  }

  // Reject oversized CSRs (a 4096-bit RSA CSR is ~1600 bytes PEM)
  if (csrPem.length > 8192) {
    throw Object.assign(new Error('CSR too large'), { statusCode: 400 });
  }

  return withRegistryLock(async () => {
    // Check registry for duplicate (non-revoked) label
    const registry = await loadAgentRegistry();
    const existing = registry.agents.find((a) => a.label === label && !a.revoked);
    if (existing) {
      throw Object.assign(new Error(`Agent certificate with label "${label}" already exists`), {
        statusCode: 409,
      });
    }

    // Verify CA key exists
    try {
      await access(`${PKI_DIR}/ca.key`, constants.R_OK);
    } catch {
      try {
        await execa('sudo', ['test', '-r', `${PKI_DIR}/ca.key`]);
      } catch {
        throw Object.assign(new Error('CA key not found — cannot sign certificate'), {
          statusCode: 500,
        });
      }
    }

    const tmpSuffix = crypto.randomBytes(8).toString('hex');
    const csrPath = `${AGENTS_DIR}/.enroll-csr-${tmpSuffix}.pem`;
    const certPath = `${AGENTS_DIR}/.enroll-cert-${tmpSuffix}.pem`;

    try {
      // Ensure agents directory exists
      await execa('sudo', ['mkdir', '-p', AGENTS_DIR]);
      await execa('sudo', ['chown', 'portlama:portlama', AGENTS_DIR]);

      // Write the CSR to a temp file
      await writeFile(csrPath, csrPem, { mode: 0o600 });

      // Validate CSR structure and signature before signing
      try {
        await execa('openssl', ['req', '-verify', '-in', csrPath, '-noout']);
      } catch {
        throw Object.assign(
          new Error('Invalid CSR: structure or signature verification failed'),
          { statusCode: 400 },
        );
      }

      // Sign the CSR with the CA (2-year validity).
      // The CSR subject may use a placeholder (the agent doesn't know the label
      // until after enrollment). OpenSSL 3.x (Ubuntu 24.04) supports -subj with
      // x509 -req to override the subject in the signed certificate.
      const cnSubject = isDelegated
        ? `/CN=${label}/O=Portlama`
        : `/CN=agent:${label}/O=Portlama`;
      logger.info({ label, isDelegated }, 'Signing enrollment CSR with CA');
      await execa('sudo', [
        'openssl',
        'x509',
        '-req',
        '-in',
        csrPath,
        '-CA',
        `${PKI_DIR}/ca.crt`,
        '-CAkey',
        `${PKI_DIR}/ca.key`,
        '-CAcreateserial',
        '-out',
        certPath,
        '-days',
        '730',
        '-sha256',
        '-subj',
        cnSubject,
      ]);

      // Make cert readable (match signAdminCSR pattern)
      await execa('sudo', ['chown', 'portlama:portlama', certPath]);
      await execa('sudo', ['chmod', '644', certPath]);

      // Read the serial number
      const { stdout: serialOut } = await execa('openssl', [
        'x509',
        '-in',
        certPath,
        '-serial',
        '-noout',
      ]);
      const serialMatch = serialOut.match(/serial=([A-Fa-f0-9]+)/);
      const serial = serialMatch ? serialMatch[1] : '';

      // Read expiry
      const expiry = await readCertExpiry(certPath);
      const expiresAt = expiry?.expiresAt || new Date(Date.now() + 730 * 86400000).toISOString();

      // Read the signed certificate PEM
      const certPem = await readFile(certPath, 'utf-8');

      // Read the CA certificate PEM
      let caCertPem;
      try {
        caCertPem = await readFile(`${PKI_DIR}/ca.crt`, 'utf-8');
      } catch {
        // Try with sudo
        const { stdout } = await execa('sudo', ['cat', `${PKI_DIR}/ca.crt`]);
        caCertPem = stdout;
      }

      // Add to registry. For delegated enrollments, store the delegation metadata.
      // We reuse the registry loaded at the top of withRegistryLock — the mutex
      // guarantees no concurrent modifications.
      const registryEntry = {
        label,
        serial,
        capabilities: isDelegated ? (capabilities || []) : (capabilities || ['tunnels:read']),
        allowedSites: isDelegated ? [] : (allowedSites || []),
        enrollmentMethod: isDelegated ? 'delegated' : 'hardware-bound',
        createdAt: new Date().toISOString(),
        expiresAt,
        revoked: false,
      };
      if (isDelegated && opts?.delegatedBy) {
        registryEntry.delegatedBy = opts.delegatedBy;
      }
      registry.agents.push(registryEntry);
      await saveAgentRegistry(registry);

      logger.info({ label, serial, isDelegated }, 'Enrollment CSR signed and agent registered');

      return { certPem, caCertPem, serial, expiresAt, label };
    } finally {
      // Clean up temp files
      await unlink(csrPath).catch(() => {});
      await unlink(certPath).catch(() => {});
      await execa('sudo', ['rm', '-f', `${PKI_DIR}/ca.srl`]).catch(() => {});
    }
  });
}
