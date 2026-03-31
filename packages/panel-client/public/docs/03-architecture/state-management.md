# State Management Architecture

> Portlama stores all state in JSON and YAML files on disk — no database, no external services. State changes use atomic writes to prevent corruption from crashes or power loss.

## In Plain English

Portlama does not use a database. All configuration and state is stored in plain files on the VPS:

- `panel.json` holds the system configuration (IP address, domain, onboarding progress)
- `tunnels.json` holds the list of configured tunnels
- `sites.json` holds the list of configured static sites
- `invitations.json` holds pending user invitations
- `users.yml` holds the Authelia user database (usernames, password hashes, TOTP secrets)

These files are small (a few kilobytes each) and are read/written atomically — meaning the system writes to a temporary file first, then renames it into place. If the server crashes mid-write, the old file is preserved intact. You never end up with a half-written, corrupted file.

This approach works because Portlama manages a small amount of state (one admin, a handful of tunnels and users). A database would add RAM overhead and operational complexity for no benefit at this scale.

## Overview

```
/etc/portlama/
├── panel.json              ← Central config (IP, domain, onboarding state)
├── tunnels.json            ← Tunnel definitions
├── sites.json              ← Static site definitions
├── invitations.json        ← Pending user invitations
├── plugins.json            ← Plugin registry (installed plugins, enabled state)
├── ticket-scopes.json      ← Ticket scope registry (scopes, instances, assignments)
├── tickets.json            ← Ticket and session store
├── storage-config.json     ← Storage server registry and plugin bindings
├── storage-master.key      ← 32-byte master key for storage credential encryption
└── pki/
    ├── ca.key              ← CA private key
    ├── ca.crt              ← CA certificate
    ├── client.key          ← Client private key
    ├── client.crt          ← Client certificate
    ├── client.p12          ← PKCS12 bundle for browser import
    ├── .p12-password       ← PKCS12 password
    ├── self-signed.pem     ← Self-signed TLS cert for IP vhost
    ├── self-signed-key.pem ← Self-signed TLS key for IP vhost
    ├── revoked.json        ← Revoked certificate serial numbers
    ├── enrollment-tokens.json ← One-time enrollment tokens
    └── agents/             ← Agent certificate storage
        ├── registry.json   ← Metadata for all agent certs
        └── <label>/        ← Per-agent directory
            ├── client.key  ← Agent private key
            ├── client.crt  ← Agent certificate
            └── client.p12  ← Agent PKCS12 bundle

/etc/authelia/
├── configuration.yml       ← Authelia main config
├── users.yml               ← User database (usernames, bcrypt hashes, groups)
├── .secrets.json           ← JWT + session + storage encryption secrets
├── db.sqlite3              ← Authelia session/TOTP storage
└── notifications.txt       ← Notification log (filesystem notifier)

/var/www/portlama/
└── <site-uuid>/            ← Static site file roots (one per site)
    ├── index.html
    └── ...
```

## Atomic Writes Pattern

All JSON state files use the same atomic write pattern, implemented in `packages/panel-server/src/lib/state.js` and `packages/panel-server/src/lib/config.js`:

```
1. Serialize data to JSON string
2. Write to <path>.tmp in the same directory
3. Open the temp file and call fd.sync() (fsync)
4. Rename temp file to final path
```

In code:

```javascript
export async function writeTunnels(tunnels) {
  const filePath = tunnelsPath();
  const tmpPath = `${filePath}.tmp`;

  const content = JSON.stringify(tunnels, null, 2) + '\n';
  await writeFile(tmpPath, content, 'utf-8');

  // fsync: flush data to disk before rename
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();

  await rename(tmpPath, filePath);
}
```

**Why this works:**

- `rename()` is atomic on POSIX filesystems — it either completes fully or not at all
- `fd.sync()` ensures the data is flushed to the physical disk before the rename
- If the process crashes during `writeFile`, only the `.tmp` file is affected — the original state file is untouched
- If the process crashes after `fd.sync()` but before `rename()`, the `.tmp` file has valid data and the original is untouched
- The worst case is losing the most recent write, which preserves the previous consistent state

**Why the temp file is in the same directory:**

- `rename()` is only atomic within the same filesystem
- `/etc/portlama/tunnels.json.tmp` and `/etc/portlama/tunnels.json` are on the same filesystem, so the rename is guaranteed to be atomic

## Config Schema (`panel.json`)

The central configuration file, validated by Zod on every load and update.

**Location:** `/etc/portlama/panel.json` (production) or `dev/panel.json` (development)

**Schema:**

```json
{
  "ip": "203.0.113.42",
  "domain": "example.com",
  "email": "admin@example.com",
  "dataDir": "/etc/portlama",
  "staticDir": "/opt/portlama/panel-client/dist",
  "maxSiteSize": 524288000,
  "onboarding": {
    "status": "COMPLETED"
  }
}
```

**Field definitions:**

| Field               | Type                     | Required | Description                                              |
| ------------------- | ------------------------ | -------- | -------------------------------------------------------- |
| `ip`                | `string`                 | Yes      | VPS public IP address (detected during install)          |
| `domain`            | `string \| null`         | Yes      | Base domain (set during onboarding, null before)         |
| `email`             | `string (email) \| null` | Yes      | Admin email for Let's Encrypt (set during onboarding)    |
| `dataDir`           | `string`                 | Yes      | Path to state directory (`/etc/portlama`)                |
| `serverId`          | `string (uuid)`          | No       | Auto-generated UUIDv4, bucket prefix for multi-server storage isolation |
| `staticDir`         | `string`                 | No       | Path to panel-client dist (overrides default resolution) |
| `maxSiteSize`       | `number`                 | No       | Maximum static site size in bytes (default: 500 MB)      |
| `adminAuthMode`     | `enum`                   | No       | `"p12"` (default) or `"hardware-bound"`                  |
| `panel2fa`          | `object`                 | No       | Built-in TOTP 2FA configuration                         |
| `sessionSecret`     | `string \| null`         | No       | HMAC key for signed session cookies (default: null)      |
| `onboarding.status` | `enum`                   | Yes      | Current onboarding state                                 |

**Zod validation:**

```javascript
const ConfigSchema = z.object({
  ip: z.string().min(1),
  domain: z.string().nullable(),
  email: z.string().email().nullable(),
  dataDir: z.string().min(1),
  serverId: z.string().uuid().optional(),
  staticDir: z.string().optional(),
  maxSiteSize: z
    .number()
    .optional()
    .default(500 * 1024 * 1024),
  adminAuthMode: z.enum(['p12', 'hardware-bound']).optional().default('p12'),
  panel2fa: z.object({
    enabled: z.boolean(),
    secret: z.string().nullable(),
    setupComplete: z.boolean(),
  }).optional().default({ enabled: false, secret: null, setupComplete: false }),
  sessionSecret: z.string().nullable().optional().default(null),
  onboarding: z.object({
    status: z.enum(['FRESH', 'DOMAIN_SET', 'DNS_READY', 'PROVISIONING', 'COMPLETED']),
  }),
});
```

Validation runs:

- At server startup (`loadConfig()`)
- Before every config update (`updateConfig()`)
- Invalid data throws a Zod error, caught by the error handler and returned as a 400

**Config loading chain:**

```
1. Check PORTLAMA_CONFIG environment variable → use if set
2. Check NODE_ENV:
   - "development" (or unset) → dev/panel.json relative to package root
   - "production" → /etc/portlama/panel.json
3. Read and parse JSON
4. Validate with Zod schema
5. Cache in module-level variable
```

**Config updates (`updateConfig`):**

```javascript
export async function updateConfig(patch) {
  // Deep clone current config
  const merged = structuredClone(config);

  // Merge patch (onboarding and panel2fa are merged as sub-objects, others replaced)
  for (const key of Object.keys(patch)) {
    if (key === 'onboarding' && typeof patch.onboarding === 'object' && patch.onboarding !== null) {
      merged.onboarding = { ...merged.onboarding, ...patch.onboarding };
    } else if (key === 'panel2fa' && typeof patch.panel2fa === 'object' && patch.panel2fa !== null) {
      merged.panel2fa = { ...merged.panel2fa, ...patch.panel2fa };
    } else {
      merged[key] = patch[key];
    }
  }

  // Re-validate
  const validated = ConfigSchema.parse(merged);

  // Atomic write
  const tmpPath = `${configPath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(validated, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });

  // fsync: flush data to disk before rename
  const fd = await open(tmpPath, 'r');
  await fd.sync();
  await fd.close();

  await rename(tmpPath, configPath);

  // Update cache
  config = validated;
  return structuredClone(config);
}
```

The `onboarding` and `panel2fa` fields get special merge treatment — updating `{ onboarding: { status: 'COMPLETED' } }` or `{ panel2fa: { enabled: true } }` preserves other sub-fields rather than replacing the entire object.

All reads via `getConfig()` return a `structuredClone`, preventing callers from accidentally mutating the cached config.

## Onboarding State Machine

The onboarding process follows a linear state progression stored in `panel.json`:

```
FRESH ──────────► DOMAIN_SET ──────────► DNS_READY
  │                    │                      │
  │ POST /domain       │ POST /verify-dns     │ POST /provision
  │ Sets domain+email  │ Confirms DNS ok      │ Starts provisioning
  │                    │                      │
  │                    │                      ▼
  │                    │               PROVISIONING
  │                    │                      │
  │                    │                      │ Background task completes
  │                    │                      │
  │                    │                      ▼
  │                    │                 COMPLETED
  │                    │                      │
  └────────────────────┘──────────────────────┘
                                              │
                                   Onboarding routes → 410 Gone
                                   Management routes → accessible
```

State transitions are enforced at multiple levels:

1. **Route guards** — `onboardingOnly()` returns 410 for any onboarding route when status is `COMPLETED`; `managementOnly()` returns 503 when status is not `COMPLETED`
2. **Provisioning endpoint** — validates that status is `DNS_READY` or `PROVISIONING` before starting
3. **Domain endpoint** — validates that status is `FRESH`
4. **DNS endpoint** — validates that status is `DOMAIN_SET`

Once provisioning completes and status is set to `COMPLETED`, onboarding routes are permanently locked out (410 Gone). The only way to re-run onboarding would be to manually edit `panel.json`, which is an intentional safety measure.

## Tunnel State (`tunnels.json`)

Stored at `/etc/portlama/tunnels.json`. An array of tunnel objects.

**Example:**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "subdomain": "myapp",
    "port": 3000,
    "description": "My Web App",
    "createdAt": "2024-03-14T10:30:00.000Z"
  },
  {
    "id": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
    "subdomain": "api",
    "port": 8080,
    "description": "API Server",
    "createdAt": "2024-03-14T11:00:00.000Z"
  }
]
```

**Operations:**

- `readTunnels()` — returns the array, or `[]` if the file does not exist
- `writeTunnels(tunnels)` — atomic write of the full array

Read returns `[]` for missing files (ENOENT), enabling the system to start with no tunnels defined.

**Tunnel lifecycle:**

1. `POST /api/tunnels` — adds a tunnel object, issues TLS cert, writes nginx vhost
2. `DELETE /api/tunnels/:id` — removes the tunnel object, removes nginx vhost
3. On both: the full array is written atomically after modification

## Site State (`sites.json`)

Stored at `/etc/portlama/sites.json`. An array of site objects.

**Example:**

```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "name": "My Blog",
    "subdomain": "blog",
    "fqdn": "blog.example.com",
    "spaMode": false,
    "autheliaProtected": false,
    "rootPath": "/var/www/portlama/b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "createdAt": "2024-03-14T12:00:00.000Z"
  }
]
```

**Operations:**

- `readSites()` — returns the array, or `[]` if the file does not exist
- `writeSites(sites)` — atomic write of the full array

Same atomic write pattern and ENOENT handling as tunnels.

## YAML Writes for Authelia (`users.yml`)

Authelia reads its user database from `/etc/authelia/users.yml` at runtime. Portlama writes this file when creating, updating, or deleting users.

**Format:**

```yaml
users:
  admin:
    displayname: admin
    password: $2b$12$... # bcrypt hash
    email: admin@portlama.local
    groups:
      - admins
  alice:
    displayname: alice
    password: $2b$12$...
    email: alice@example.com
    groups:
      - admins
```

**Write pattern:**

Authelia user file writes go through `sudoWriteFile()` in `packages/panel-server/src/lib/authelia.js`:

```javascript
async function sudoWriteFile(destPath, content, mode = '644') {
  const tmpFile = path.join(tmpdir(), `portlama-${crypto.randomBytes(4).toString('hex')}`);
  await fsWriteFile(tmpFile, content, 'utf-8');
  await execa('sudo', ['mv', tmpFile, destPath]);
  await execa('sudo', ['chmod', mode, destPath]);
}
```

This pattern:

1. Writes to a temp file in `/tmp/` (writable by the `portlama` user)
2. Uses `sudo mv` to move it to `/etc/authelia/users.yml` (requires root)
3. Uses `sudo chmod` to set permissions (600 for sensitive files)

The `sudo mv` is atomic (same-filesystem rename). The scoped `sudoers` rules allow the `portlama` user to `mv` from `/tmp/*` to `/etc/authelia/*`.

**Critical invariant:** After writing `users.yml`, the Authelia service must be restarted to pick up changes. Authelia does not watch the file for changes. The Panel Server calls `reloadAuthelia()` (which runs `systemctl restart authelia`) after every user modification.

**Safety rule:** The Panel Server prevents deleting the last user in the Authelia database. Without at least one user, no one could authenticate to access tunneled apps.

## Storage Server Registry (`storage-config.json`)

The storage system manages S3-compatible object storage servers and their bindings to plugins. Storage credentials (access key, secret key) are encrypted at rest using AES-256-GCM with scrypt key derivation.

**Encryption scheme:**

1. A 32-byte master key is generated once and stored at `/etc/portlama/storage-master.key` (mode 0600)
2. For each credential, a random 16-byte salt is generated
3. The master key is passed through scrypt (N=16384, r=8, p=1) with the salt to derive a 32-byte encryption key
4. The credential is encrypted with AES-256-GCM using a random 12-byte IV
5. The output is packed as `[salt (16)] [iv (12)] [authTag (16)] [ciphertext (...)]` and base64-encoded

**State file (`storage-config.json`):**

```json
{
  "servers": [
    {
      "id": "uuid",
      "label": "my-storage",
      "provider": "digitalocean",
      "region": "fra1",
      "bucket": "my-bucket",
      "endpoint": "https://fra1.digitaloceanspaces.com",
      "accessKeyEncrypted": "<base64-encoded encrypted credential>",
      "secretKeyEncrypted": "<base64-encoded encrypted credential>",
      "registeredAt": "2026-03-30T10:00:00.000Z"
    }
  ],
  "bindings": [
    {
      "pluginName": "sync",
      "storageServerId": "uuid",
      "boundAt": "2026-03-30T10:05:00.000Z"
    }
  ]
}
```

**Concurrency:** All read-modify-write operations are serialized via a promise-chain mutex. Writes use the same atomic pattern (temp file, fsync, rename).

## Config Path Resolution

Different config files are resolved through different mechanisms:

| File               | Resolution                                                                             |
| ------------------ | -------------------------------------------------------------------------------------- |
| `panel.json`       | `PORTLAMA_CONFIG` env var → `dev/panel.json` (dev) → `/etc/portlama/panel.json` (prod) |
| `tunnels.json`     | `PORTLAMA_STATE_DIR` env var → `/etc/portlama` + `/tunnels.json`                       |
| `sites.json`       | `PORTLAMA_STATE_DIR` env var → `/etc/portlama` + `/sites.json`                         |
| `invitations.json` | `PORTLAMA_STATE_DIR` env var → `/etc/portlama` + `/invitations.json`                   |
| `users.yml`        | Hardcoded: `/etc/authelia/users.yml`                                                   |
| PKI files          | `PORTLAMA_PKI_DIR` env var → `/etc/portlama/pki`                                       |

Environment variables allow overriding paths for development and testing without modifying code.

## File Permissions

| File                | Mode   | Owner               | Rationale                               |
| ------------------- | ------ | ------------------- | --------------------------------------- |
| `panel.json`        | `0600` | `portlama:portlama` | Contains sensitive config, owner-only access |
| `tunnels.json`      | `0600` | `portlama:portlama` | Written by Panel Server                 |
| `sites.json`        | `0600` | `portlama:portlama` | Written by Panel Server                 |
| `invitations.json`  | `0600` | `portlama:portlama` | Written by Panel Server                 |
| `storage-config.json` | `0600` | `portlama:portlama` | Storage registry (credentials AES-256-GCM encrypted) |
| `storage-master.key`  | `0600` | `portlama:portlama` | 32-byte master key for storage encryption |
| `pki/ca.key`        | `0600` | `root:root`         | CA private key — most sensitive file    |
| `pki/ca.crt`        | `0644` | `root:root`         | CA cert — needs to be readable by nginx |
| `pki/client.key`    | `0600` | `root:root`         | Client private key                      |
| `pki/client.crt`    | `0644` | `root:root`         | Client cert                             |
| `pki/client.p12`    | `0600` | `root:root`         | PKCS12 bundle with private key          |
| `pki/.p12-password` | `0600` | `root:root`         | Password for PKCS12 bundle              |
| `users.yml`         | `0600` | `root:root`         | Contains bcrypt password hashes         |
| `configuration.yml` | `0600` | `root:root`         | Contains JWT and session secrets        |
| `.secrets.json`     | `0600` | `root:root`         | Encryption keys                         |

PKI and Authelia files are owned by root because they are written during installation (as root) or via `sudo` commands. The Panel Server reads them using `sudo` when needed (e.g., reading `users.yml` for the users API).

## Concurrency Safety

The Panel Server is a single-process Node.js application (single-threaded event loop). This provides natural serialization for most operations — two concurrent API requests that modify `tunnels.json` will execute sequentially within the event loop.

For operations that spawn external processes with side effects, additional serialization is implemented:

**Chisel config updates** use a promise-chain mutex:

```javascript
let chiselUpdateLock = Promise.resolve();

export async function updateChiselConfig(tunnels) {
  const previousLock = chiselUpdateLock;
  let resolveLock;
  chiselUpdateLock = new Promise((resolve) => {
    resolveLock = resolve;
  });

  try {
    await previousLock;
    await _doUpdateChiselConfig(tunnels);
  } finally {
    resolveLock();
  }
}
```

This ensures that concurrent tunnel creation requests do not trigger multiple simultaneous Chisel restarts.

## Key Files

| File                                          | Role                                           |
| --------------------------------------------- | ---------------------------------------------- |
| `packages/panel-server/src/lib/storage.js`    | Storage server registry, plugin bindings, AES-256-GCM encryption |
| `packages/panel-server/src/lib/config.js`     | Config loading, Zod validation, atomic updates |
| `packages/panel-server/src/lib/state.js`      | tunnels.json + sites.json atomic read/write    |
| `packages/panel-server/src/lib/authelia.js`   | users.yml read/write via sudo                  |
| `packages/panel-server/src/lib/files.js`      | Static site file operations                    |
| `packages/create-portlama/src/tasks/panel.js` | Initial panel.json creation                    |
| `packages/create-portlama/src/tasks/mtls.js`  | Initial PKI file creation                      |

## Design Decisions

### Why JSON instead of SQLite?

SQLite would work, but adds a binary dependency and ~1 MB of RAM for the database engine. JSON files can be read with `cat`, edited with any text editor, and backed up with `cp`. At the current scale (tens of entries), JSON parsing is effectively free. The atomic write pattern provides the same crash-safety guarantees as SQLite's WAL journal.

### Why not watch files for changes?

File watching (via `fs.watch` or inotify) adds complexity and platform-specific behavior. Since all state modifications go through the Panel Server API, the in-memory cache is always consistent with the disk. Authelia is the exception — it reads `users.yml` independently — which is why a restart is required after modifications.

### Why structuredClone for getConfig?

Without cloning, `getConfig()` would return a reference to the cached config object. Any modification to the returned object (even accidental) would corrupt the cache. `structuredClone` creates a deep copy, making the config effectively immutable from the caller's perspective. This is a small performance cost that prevents a class of subtle bugs.

### Why fsync before rename?

On Linux, `writeFile` may return before data is flushed to the physical disk (the data may be in the kernel's page cache). If power is lost at this point, the temp file could be empty or corrupted. `fd.sync()` forces the data to disk, ensuring the rename always produces a valid file. This is the standard pattern for durable writes in database systems.

### Why YAML for Authelia users instead of JSON?

Authelia's file-based authentication backend expects YAML format. This is an external constraint, not a choice. The Panel Server uses the `js-yaml` library for serialization and `sudo cat` for reading (since the file is owned by root with mode 600).
