import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { getSystemStats } from '../../lib/system-stats.js';
import { getConfig } from '../../lib/config.js';

const UpdateBodySchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g. 1.0.43)'),
});

export default async function systemRoutes(fastify, _opts) {
  fastify.get(
    '/system/stats',
    {
      preHandler: fastify.requireRole(['admin', 'agent'], { capability: 'system:read' }),
    },
    async (request, reply) => {
      try {
        const stats = await getSystemStats(request.log);
        return stats;
      } catch {
        return reply.code(500).send({ error: 'Failed to retrieve system stats' });
      }
    },
  );

  // ------------------------------------------------------------------
  // POST /system/update — trigger a panel server update
  //
  // Uses `systemd-run` to launch the update script in a transient
  // systemd unit. This is critical: the panel runs as the
  // portlama-panel service, and systemd's default KillMode
  // (control-group) kills ALL processes in the cgroup when the
  // service stops. A detached child (spawn + unref) still lives in
  // the parent's cgroup, so it gets killed when the installer runs
  // `systemctl stop portlama-panel`. `systemd-run` places the script
  // in its own cgroup, letting it survive the panel restart.
  //
  // Returns 202 immediately — caller should poll /api/health until
  // the server comes back with the new version.
  // ------------------------------------------------------------------
  fastify.post(
    '/system/update',
    {
      preHandler: fastify.requireRole(['admin']),
    },
    async (request, reply) => {
      const body = UpdateBodySchema.parse(request.body);
      const { version } = body;

      // Write the update script to /etc/portlama/ (NOT /tmp) because the
      // panel service uses PrivateTmp=true — files written to /tmp are in a
      // private namespace invisible to other systemd units.
      const scriptId = crypto.randomBytes(8).toString('hex');
      const configDir = getConfig().dataDir;
      // Extension must be .sh to match the tightened sudoers glob
      const scriptPath = join(configDir, `portlama-update-${scriptId}.sh`);

      // Build script without interpolating user input — version is validated
      // by the Zod regex above (/^\d+\.\d+\.\d+$/), but we avoid the fragile
      // pattern of template-literal shell scripts. scriptPath is server-derived
      // (dataDir + random hex) but we still quote it defensively.
      const escapedScriptPath = scriptPath.replace(/'/g, "'\\''");
      const script = [
        '#!/bin/bash',
        'set -e',
        '',
        '# Give the HTTP response time to flush',
        'sleep 2',
        '',
        '# Run the installer in redeploy mode — it stops and restarts the panel service',
        `npx --yes '@lamalibre/create-portlama@${version}' --yes 2>&1 || true`,
        '',
        '# Self-cleanup',
        `rm -f '${escapedScriptPath}'`,
      ].join('\n') + '\n';

      await writeFile(scriptPath, script, { mode: 0o700 });

      // Launch in a transient systemd unit so the script survives
      // the panel service being stopped and restarted by the installer.
      // Uses sudo because the panel runs as the portlama user, and
      // systemd-run needs root to create system-level transient units.
      const unitName = `portlama-update-${scriptId}`;
      execFile('sudo', [
        'systemd-run',
        '--unit', unitName,
        '--no-block',
        '/usr/bin/bash', scriptPath,
      ], (err) => {
        if (err) {
          request.log.error({ err, version }, 'Failed to launch update unit');
          // Clean up the update script if systemd-run fails
          unlink(scriptPath).catch(() => {});
        }
      });

      request.log.info({ version, unit: unitName }, 'Panel update initiated via systemd-run');

      return reply.code(202).send({
        ok: true,
        message: `Update to create-portlama@${version} initiated. The panel will restart shortly.`,
      });
    },
  );
}
