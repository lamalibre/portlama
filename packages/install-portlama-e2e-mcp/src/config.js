// ============================================================================
// E2E MCP — Configuration & Constants
// ============================================================================

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the portlama repository. */
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/** E2E test directories. */
export const SINGLE_VM_DIR = path.join(REPO_ROOT, 'tests', 'e2e');
export const THREE_VM_DIR = path.join(REPO_ROOT, 'tests', 'e2e-three-vm');
export const E2E_LOGS_DIR = path.join(REPO_ROOT, 'e2e-logs');

/** Temp directory for intermediate run data. */
export const TEMP_DIR = '/tmp/portlama-e2e';

/** VM names. */
export const VM_HOST = 'portlama-host';
export const VM_AGENT = 'portlama-agent';
export const VM_VISITOR = 'portlama-visitor';
export const ALL_VMS = [VM_HOST, VM_AGENT, VM_VISITOR];

/** Default test domain. */
export const TEST_DOMAIN = 'test.portlama.local';

/** VM short-name → full multipass name mapping. */
export const VM_NAME_MAP = { host: VM_HOST, agent: VM_AGENT, visitor: VM_VISITOR };

/** VM profiles — resource allocation tiers. */
export const PROFILES = {
  production: {
    description: 'Matches $4 DigitalOcean droplet — final publishable runs only',
    cpus: 1,
    memory: '512M',
    disk: '10G',
  },
  development: {
    description: 'Fast iteration — logic correctness, comfortable resources',
    cpus: 2,
    memory: '2G',
    disk: '10G',
  },
  performance: {
    description: 'Heavy lifting — parallel tests, fast builds',
    cpus: 4,
    memory: '4G',
    disk: '20G',
  },
};

/** Snapshot checkpoints — named save-points in the VM lifecycle. */
export const CHECKPOINTS = {
  'post-create': 'VMs exist but no setup has run',
  'post-setup': 'All VMs provisioned, onboarding complete, services running',
};
