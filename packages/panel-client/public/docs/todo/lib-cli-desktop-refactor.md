# Refactor: lib → cli → desktop Dependency Chain (v2.0.0)

> Consolidate business logic into a shared lib layer, expose it through thin CLIs, and have the desktop app consume the CLIs — eliminating ~60 Rust reimplementations of JavaScript logic. All packages bump to 2.0.0. All breaking changes accepted. Feria used as local registry throughout to validate before npm publish. **Feria itself is out of scope for this refactor** — it will be addressed separately.

## Motivation

The desktop app (Tauri/Rust) reimplements business logic that already exists in the CLI's JavaScript lib/ modules. When a JSON schema changes (e.g., `agents.json`, `plugins.json`), two implementations must be updated — JavaScript and Rust — with no shared contract between them. This is the primary source of maintenance cost and subtle bugs.

Additionally, the server side has no operational CLI at all. `create-portlama` is a provisioner (OS hardening, nginx, Authelia, certificates), not a day-to-day management tool. Server operations like uninstall, reset-admin, status, and plugin management have no terminal interface — they're either standalone scripts (`portlama-reset-admin`) or only accessible through the browser panel.

On the agent side, `portlama-agent` is a monolith that bundles CLI commands, a REST API daemon on :9393, and business logic all in one package. This means a CLI bug fix requires restarting the daemon, the CLI loads Fastify even when it doesn't need it, and root-capable CLI code paths live in the same binary as the daemon.

`portlama-cloud` already follows the correct pattern: TypeScript lib → CLI with `--json` NDJSON → desktop spawns subprocess. This refactor extends that pattern to the rest of the codebase.

## Naming Convention

All packages use the `@lamalibre/` scope. The naming pattern is:

```
portlama                     the project itself — core library (like express, fastify, react)
portlama-{domain}            operational CLI for a domain (agent, server, cloud)
portlama-{domain}d           long-running daemon for a domain (agentd, serverd)
portlama-{domain}-ui         React UI components for a domain (agent-ui, server-ui)
portlama-{sdk}               standalone SDK (tickets, identity)
portlama-desktop             Tauri desktop app (multi-target: full, agent-only, server-only)
create-portlama-{target}     npx one-shot provisioner/installer (npx create-portlama, npx create-portlama-agent, etc.)
feria                        dev registry — OUT OF SCOPE, do not touch
```

### Naming Rules

- **`portlama`** is the core lib. You `import { ... } from '@lamalibre/portlama'`. No `-lib` suffix.
- **`-d` suffix** for daemons — Unix convention (`httpd`, `sshd`, `mongod`). Instantly signals "long-running process".
- **`-ui`** for React component libraries — universal term, avoids "panel-server serves the panel" tautology.
- **`create-*`** for all npx one-shot tools — the one npm convention everyone knows.
- **Subject-first** word order: `portlama-agent-ui` (agent's UI), not `portlama-ui-agent`.
- **Domain grouping**: packages sort alphabetically by domain (`agent`, `server`, `cloud`).

## Target Architecture

```
portlama                              core library (types, constants, schemas, plugin host, file helpers)
    │
    ├── portlama/agent                    agent domain logic (~/.portlama/)
    │       │
    │       ├── portlama-agent                agent operational CLI (thin, no Fastify)
    │       │
    │       ├── portlama-agentd               agent REST daemon :9393
    │       │       │
    │       │       ├── portlama-desktop          calls REST API / spawns CLI subprocess
    │       │       └── portlama-agent-ui         browser SPA build
    │       │
    │       ├── create-portlama-agent         agent provisioner (npx create-portlama-agent)
    │       ├── create-portlama-admin         admin cert upgrade (npx create-portlama-admin)
    │       └── create-portlama-e2e           E2E test MCP (npx create-portlama-e2e)
    │
    ├── portlama/server                   server domain logic (/etc/portlama/)
    │       │
    │       ├── portlama-server               server operational CLI (thin, no Fastify)
    │       │
    │       ├── portlama-serverd              server REST daemon :3100
    │       │       │
    │       │       ├── portlama-desktop          calls REST API via curl_panel
    │       │       └── portlama-server-ui        browser SPA build
    │       │
    │       └── create-portlama               server provisioner (npx create-portlama)
    │
    ├── portlama-cloud                    cloud lib + CLI (already follows correct pattern)
    ├── portlama-tickets                  agent-to-agent auth SDK
    └── portlama-identity                 Authelia identity SDK
```

### Complete Package Inventory

| # | Package (npm name) | Type | Depends on | Purpose |
|---|---|---|---|---|
| 1 | `@lamalibre/portlama` | core lib | nothing | Types, constants, Zod schemas, plugin host Fastify plugin, atomic file helpers, client interfaces |
| | | | | Subpath: `@lamalibre/portlama/agent` — agent domain logic |
| | | | | Subpath: `@lamalibre/portlama/server` — server domain logic |
| 2 | `@lamalibre/portlama-agent` | CLI | `portlama` | Thin agent CLI. No Fastify, no HTTP |
| 3 | `@lamalibre/portlama-agentd` | daemon | `portlama` | Agent REST API on :9393. No CLI argument parsing |
| 4 | `@lamalibre/portlama-agent-ui` | UI lib | `portlama` | Agent React components + browser SPA build. Used by desktop and agentd |
| 5 | `@lamalibre/portlama-server` | CLI | `portlama` | **NEW.** Thin server CLI. No Fastify, no HTTP |
| 6 | `@lamalibre/portlama-serverd` | daemon | `portlama` | Server REST API on :3100. No CLI argument parsing. Renamed from `panel-server` |
| 7 | `@lamalibre/portlama-server-ui` | UI lib | `portlama` | Server/admin React components + browser SPA build. Replaces both `panel-client` and `portlama-admin-panel` |
| 8 | `@lamalibre/portlama-desktop` | desktop | `portlama` | Unified Tauri app. Multi-target: full, agent-only, server-only. Credentials, tray, deep links |
| 9 | `@lamalibre/portlama-cloud` | lib + CLI | — | Cloud provider abstraction (already correct pattern) |
| 10 | `@lamalibre/portlama-tickets` | SDK | — | Agent-to-agent authorization |
| 11 | `@lamalibre/portlama-identity` | SDK | — | Authelia identity parsing and query |
| 12 | `@lamalibre/create-portlama` | provisioner | `portlama` | Server provisioner: OS hardening, nginx, Authelia, certs. `npx create-portlama` |
| 13 | `@lamalibre/create-portlama-agent` | provisioner | `portlama` | Agent provisioner: cert enrollment, service setup. `npx create-portlama-agent`. Renamed from `install-portlama-agent` |
| 14 | `@lamalibre/create-portlama-desktop` | installer | — | Desktop app installer. `npx create-portlama-desktop`. Renamed from `install-portlama-desktop` |
| 15 | `@lamalibre/create-portlama-admin` | provisioner | `portlama` | Admin cert upgrade to hardware-bound. `npx create-portlama-admin`. Renamed from `install-portlama-admin` |
| 16 | `@lamalibre/create-portlama-e2e` | test infra | — | E2E test MCP server. `npx create-portlama-e2e`. Renamed from `install-portlama-e2e-mcp` |
| 17 | `@lamalibre/feria` | dev tool | — | Dev registry + release runner. **Out of scope — do not touch in this refactor** |

### Rename Map (1.x → 2.0.0)

| 1.x name | 2.0.0 name | Change type |
|---|---|---|
| `panel-server` | `portlama-serverd` | Renamed |
| `panel-client` | `portlama-server-ui` | Merged with `portlama-admin-panel` |
| `portlama-admin-panel` | `portlama-server-ui` | Merged with `panel-client` |
| `portlama-agent-panel` | `portlama-agent-ui` | Renamed |
| `portlama-agent` (monolith) | `portlama-agent` (CLI) + `portlama-agentd` (daemon) | Split |
| `install-portlama-agent` | `create-portlama-agent` | Renamed |
| `install-portlama-desktop` | `create-portlama-desktop` | Renamed |
| `install-portlama-admin` | `create-portlama-admin` | Renamed |
| `install-portlama-e2e-mcp` | `create-portlama-e2e` | Renamed |
| — | `portlama-server` | New |
| — | `portlama` (core lib) | New |

### Core Library: Subpath Exports vs Separate Packages

The core library uses **subpath exports** to provide domain-specific entry points from a single package:

```json
{
  "name": "@lamalibre/portlama",
  "exports": {
    ".":        "./dist/index.js",
    "./agent":  "./dist/agent/index.js",
    "./server": "./dist/server/index.js"
  }
}
```

```typescript
import { RESERVED_API_PREFIXES, pluginManifestSchema } from '@lamalibre/portlama';
import { loadRegistry, loadAgent, isAgentLoaded } from '@lamalibre/portlama/agent';
import { createTunnel, rotateCert } from '@lamalibre/portlama/server';
```

**Why subpath exports instead of three packages (`portlama-lib`, `portlama-lib-agent`, `portlama-lib-server`):**
- One package to version and publish instead of three
- No circular dependency risk between lib packages
- Import paths are cleaner and self-documenting
- TypeScript project references within a single package enforce the same isolation boundaries
- The `agent` and `server` subpaths can still have separate dependency trees via optional `peerDependencies`

**Isolation enforced via TypeScript project references:**
- `src/agent/` cannot import from `src/server/` and vice versa
- `src/index.ts` (shared core) cannot import from either domain
- Build fails on cross-domain imports — same guarantee as separate packages

### Symmetry: Agent Side vs Server Side

| Layer | Agent side | Server side |
|---|---|---|
| **Domain logic** | `@lamalibre/portlama/agent` | `@lamalibre/portlama/server` |
| **Operational CLI** | `portlama-agent` | `portlama-server` (new) |
| **Long-running daemon** | `portlama-agentd` on :9393 (extracted) | `portlama-serverd` on :3100 (renamed) |
| **UI components** | `portlama-agent-ui` (renamed) | `portlama-server-ui` (merged) |
| **Provisioner** | `create-portlama-agent` (renamed) | `create-portlama` |
| **Desktop consumes via** | REST to :9393 / CLI subprocess | REST to :3100 / `curl_panel` |

### Desktop: Multi-Target Build

`portlama-desktop` is a single Tauri project that produces multiple build targets:

```
portlama-desktop/
    ├── src/                        shared shell (tray, credentials, deep links, process mgmt)
    ├── src/agent/                  imports portlama-agent-ui components
    ├── src/server/                 imports portlama-server-ui components
    │
    ├── target: portlama-desktop           full app (agent + server)
    ├── target: portlama-agent-desktop     agent only (tray, local services)
    └── target: portlama-server-desktop    server only (mTLS, cloud provisioning)
```

One package, multiple binaries. Tauri feature flags in Cargo + conditional frontend imports. The full app includes both. Focused apps tree-shake to only what they need. Splitting into separate apps is a product decision that doesn't require architecture changes.

### Why Separate CLI from Daemon

The split applies to both sides — `portlama-agent` (1.x monolith) splits into `portlama-agent` (CLI) + `portlama-agentd` (daemon), matching `portlama-server` + `portlama-serverd`:

- **Deployment scope.** CLI installs globally (`/usr/local/bin/`). Daemon runs as a system service from `node_modules`. Different install paths, different permissions, different update lifecycles. A CLI bug fix shouldn't require restarting the daemon.
- **Dependency weight.** The daemon pulls in Fastify, WebSocket, all route handlers. The CLI needs none of that — it imports lib functions directly. On a 512MB VPS or a laptop, not loading Fastify for `portlama-agent status` matters.
- **Security surface.** The CLI may run as root (e.g., agent uninstall, service management). The daemon runs as a service user. Separating them means the daemon binary has no root-capable code paths.
- **Testing.** CLI commands testable without spinning up Fastify. Daemon testable without CLI argument parsing.

### `portlama-agent` CLI (extracted from current portlama-agent)

The current `portlama-agent` CLI subcommands remain, but the REST API daemon moves to `portlama-agentd`:

```
portlama-agent setup                    # enrollment, cert generation, service config
portlama-agent status                   # agent running state, config summary
portlama-agent start / stop / restart   # service lifecycle
portlama-agent logs [--follow]          # agent log tail
portlama-agent update                   # fetch latest plist/unit, restart

portlama-agent plugin install <pkg>     # install agent plugin
portlama-agent plugin uninstall <name>  # remove plugin
portlama-agent plugin status            # list installed plugins

portlama-agent panel --enable / --disable / --status  # agent panel expose

portlama-agent --json <any-command>     # NDJSON output for subprocess consumers
```

### `portlama-server` CLI (new package)

Absorbs operations currently scattered across standalone scripts, inline route logic, and missing entirely:

```
portlama-server status                  # service health, uptime, resource usage
portlama-server logs [--follow]         # journalctl portlama-serverd logs
portlama-server restart                 # restart portlama-serverd service

portlama-server plugins list            # installed plugins with status
portlama-server plugins install <pkg>   # npm install + manifest + registry
portlama-server plugins enable <name>   # enable plugin
portlama-server plugins disable <name>  # disable plugin
portlama-server plugins uninstall <name>

portlama-server tunnels list            # active tunnels
portlama-server tunnels create ...      # create tunnel (cert → nginx → chisel → state)
portlama-server tunnels delete <id>

portlama-server sites list              # managed sites
portlama-server sites create ...        # create site (managed/custom domain)
portlama-server sites delete <id>

portlama-server reset-admin             # replaces standalone portlama-reset-admin script
portlama-server uninstall               # full server teardown (new)

portlama-server certs status            # certificate expiry, renewal status
portlama-server certs renew             # force certificate renewal

portlama-server --json <any-command>    # NDJSON output for subprocess consumers
```

### Rules

1. **`portlama`** (core lib) owns shared contracts: types, constants, schemas, plugin host Fastify plugin, atomic file write helpers. Domain logic in subpath exports (`/agent`, `/server`).
2. **`portlama/agent`** owns agent-side business logic: registry CRUD, config I/O, platform paths, service lifecycle, local plugin management, service discovery. Touches `~/.portlama/` only.
3. **`portlama/server`** owns server-side business logic: server plugin lifecycle, mTLS, tunnel/site workflows, access control. Touches `/etc/portlama/` only.
4. **Operational CLIs** are thin layers: import their domain subpath, add CLI UX (prompts, progress bars), expose lib operations as subcommands with `--json`. `portlama-agent` for agent ops, `portlama-server` for server ops. No Fastify, no HTTP serving.
5. **Daemons** are thin HTTP layers: `portlama-serverd` imports `portlama/server`, handles HTTP/WebSocket only. `portlama-agentd` imports `portlama/agent`, serves REST API on :9393 + web SPA. No CLI argument parsing.
6. **UI packages** are host-agnostic React component libraries: `portlama-agent-ui` and `portlama-server-ui`. Each consumer provides its own client implementation (desktop via Tauri invoke, browser via fetch). Each package includes a browser SPA build target.
7. **Desktop** is a container, not an implementation. It has Rust for credentials, tray, deep links, and process management. All UI comes from `-ui` packages. All logic comes from daemons via REST or CLIs via subprocess. Never reimplements lib logic in Rust.
8. **Credentials stay in Rust.** macOS Keychain (`security-framework`) and Linux libsecret (`secret-tool`) are legitimately desktop-only. lib/cli accept credentials as env vars or stdin.
9. **Service lifecycle** (`launchctl`/`systemctl`) lives in `portlama/agent`. Desktop calls it through the CLI.
10. **`create-*` packages** are npx one-shot tools. They import from `portlama` for business logic but add interactive UX (Listr2, prompts, NDJSON progress). Thin wrappers, not logic owners.

## Current State: Violation Map

### Desktop Reimplements lib in Rust (~60 commands)

These operations exist as JavaScript functions in `portlama-agent/src/lib/` but were rewritten in Rust in `portlama-desktop/src-tauri/src/`:

#### Agent Registry (agents.rs vs registry.js)

| Desktop Rust | CLI lib/ equivalent | What it does |
|---|---|---|
| `get_agents` | `registry.listAgents()` + `service.isAgentLoaded()` | Read agents.json, check service status |
| `get_agent_status` | `registry.getAgent()` + `service.isAgentLoaded()` | Single agent status |
| `list_agents` | `registry.listAgents()` | Filter/list agents |
| `set_current_agent` | `registry.setCurrentAgent()` | Update current_label in agents.json |
| `remove_agent` | `registry.removeAgent()` | Delete from registry + data dir |
| `get_agent_logs` | `platform.agentLogFile()` + fs read | Read log files |
| `get_agent_config` | `config.loadAgentConfig()` | Read per-agent config |
| `start_agent` | `service.loadAgent()` | launchctl load / systemctl start |
| `stop_agent` | `service.unloadAgent()` | launchctl unload / systemctl stop |
| `restart_agent` | `service.unloadAgent()` + `service.loadAgent()` | Restart service |

#### Local Plugins (local_plugins.rs vs local-plugins.js)

| Desktop Rust | CLI lib/ equivalent | What it does |
|---|---|---|
| `get_curated_plugins` | Hardcoded list (both sides) | Return available plugins |
| `get_local_plugins` | `localPlugins.readLocalPluginRegistry()` | Read plugins.json |
| `local_install_plugin` | `localPlugins.installLocalPlugin()` | npm install + manifest read + registry write |
| `enable_local_plugin` | `localPlugins.enableLocalPlugin()` | Update status in registry |
| `disable_local_plugin` | `localPlugins.disableLocalPlugin()` | Update status in registry |
| `get_local_plugin_host_status` | `localHostService.isHostLoaded()` | Check launchd/systemd status |
| `start_local_plugin_host` | `localHostService.loadHostService()` | Start service |
| `stop_local_plugin_host` | `localHostService.unloadHostService()` | Stop service |

#### Legacy Agent Operations (commands.rs vs config.js + service.js)

| Desktop Rust | CLI lib/ equivalent | What it does |
|---|---|---|
| `get_status` | `config.loadAgentConfig()` + `service.isAgentLoaded()` | Agent running state |
| `get_config` | `config.loadAgentConfig()` | Read config |
| `get_panel_url` | `config.loadAgentConfig().panelUrl` | Extract URL |
| `get_logs` | `platform.agentLogFile()` + fs read | Read logs |
| `update_agent` | `update` command logic | Fetch plist, rewrite, restart |

### Business Logic Only in Rust (no lib at all)

These operations were written directly in Rust with no JavaScript equivalent. They need to be written in `portlama/agent` first, then exposed through `portlama-agent` CLI.

#### Service Discovery (services.rs) → portlama/agent

| Desktop Rust | What it does |
|---|---|
| `scan_services` | `which`/`pgrep`/`lsof`/Docker detection |
| `get_service_registry` | Read/generate services.json |
| `add_custom_service` | Write to services.json |
| `remove_custom_service` | Remove from services.json |

#### Server Registry (cloud.rs) → portlama/agent

| Desktop Rust | What it does |
|---|---|
| `get_servers` | Read servers.json |
| `set_active_server` | Update active flag in servers.json |
| `delete_server` | Remove entry from servers.json |
| `get_storage_servers` | Read storage-servers.json |
| `get_spaces_regions` | Hardcoded region list (already in portlama-cloud) |

#### Admin Cert & Mode Management (mode.rs) → portlama/agent

| Desktop Rust | What it does |
|---|---|
| `set_server_mode` | Update activeMode in servers.json |
| `get_server_mode` | Read activeMode from servers.json |
| `has_admin_cert` | Check adminAuth in servers.json |
| `import_admin_cert` | Copy P12, store creds, update registry (file ops → portlama/agent, creds → Rust) |
| `remove_admin_cert` | Delete P12, clear creds, update registry (file ops → portlama/agent, creds → Rust) |

### Agent CLI + Daemon Are One Monolith

`portlama-agent` (1.x) bundles CLI commands, REST API daemon (:9393), and business logic in one package. After refactor:

| Current location | 2.0.0 target |
|---|---|
| `portlama-agent/src/lib/` (business logic) | `portlama` (`/agent` subpath) |
| `portlama-agent/src/commands/` (CLI) | `portlama-agent` (CLI-only package) |
| `portlama-agent/src/lib/panel-server.js` (Fastify daemon) | `portlama-agentd` |
| `portlama-agent/src/lib/panel-api-routes.js` (REST routes) | `portlama-agentd` |
| `portlama-agent/src/lib/agent-plugin-router.js` (plugin mounting) | `portlama-agentd` (uses plugin host from `portlama`) |
| `portlama-agent/panel-dist/` (SPA assets) | `portlama-agentd` (built from `portlama-agent-ui`) |

### Server Has No Operational CLI

These operations currently have no terminal interface or exist only as standalone scripts:

| Operation | Current state | 2.0.0 target |
|---|---|---|
| Server status | Browser panel only | `portlama-server status` |
| Server logs | `journalctl` manually | `portlama-server logs` |
| Plugin management | Browser panel or REST API only | `portlama-server plugins ...` |
| Tunnel management | Browser panel or REST API only | `portlama-server tunnels ...` |
| Site management | Browser panel or REST API only | `portlama-server sites ...` |
| Reset admin | Standalone `portlama-reset-admin` script | `portlama-server reset-admin` |
| Uninstall | Doesn't exist | `portlama-server uninstall` |
| Certificate status | Browser panel only | `portlama-server certs status` |
| Certificate renewal | Certbot cron only | `portlama-server certs renew` |

### Desktop Correctly Delegates (~120 commands)

`admin_commands.rs` correctly delegates all server-panel operations through the REST API. These are fine:

- All user management → `curl_panel` → portlama-serverd `/api/users`
- All site management → `curl_panel` → portlama-serverd `/api/sites`
- All certificate ops → `curl_panel` → portlama-serverd `/api/certs`
- All plugin management → `curl_panel` → portlama-serverd `/api/plugins`
- All ticket operations → `curl_panel` → portlama-serverd `/api/tickets`
- All storage operations → `curl_panel` → portlama-serverd `/api/storage`
- All 2FA operations → `curl_panel` → portlama-serverd `/api/settings/2fa`

### Desktop Correctly Desktop-Only (~25 commands)

These legitimately belong in Rust:

- **Credentials**: macOS Keychain / Linux libsecret access
- **Tray**: System tray icon state management
- **Deep links**: `portlama://` URL scheme handling
- **Browser launch**: Open external URLs
- **P12 password storage**: OS credential store operations
- **2FA session**: In-process session token (desktop-specific, not persisted)

### Business Logic Locked in Route Handlers (panel-server → portlama-serverd)

These operations are in route handlers instead of lib. Should move to `portlama/server` so both `portlama-serverd` and `portlama-server` CLI can use them.

| Route File | What's inline | Lines |
|---|---|---|
| `tunnels.js` | 4-step tunnel creation workflow (cert → nginx → chisel → state) with rollback | ~170 |
| `sites.js` | Site creation branching (managed vs custom domain), DNS validation | ~170 |
| `onboarding/provision.js` | Full provisioning orchestrator with progress streaming | ~250 |
| `settings.js` | Rate limiting (in-memory IP throttle for 2FA) | ~70 |
| `onboarding/dns.js` | DNS A-record resolution and diagnostics | ~60 |
| `logs.js` | WebSocket journalctl stream with backpressure | ~100 |

## Shared Infrastructure Duplication

### Plugin Hosting (three independent implementations) → portlama

| Server | File | What it does |
|---|---|---|
| portlama-serverd (:3100) | `panel-server/src/routes/plugin-router.js` | CJS/ESM plugin load, bundle serve, 503 disabled handler |
| portlama-agentd (:9393) | `portlama-agent/src/lib/agent-plugin-router.js` | Same logic, different auth |
| Local host (:9293) | `portlama-agent/src/lib/local-plugin-host.js` | Same logic, no auth |

Becomes a single Fastify plugin in `portlama`, configured per server with auth strategy and data directory.

### Plugin Manifest Validation (three copies) → portlama

| Package | File | What it validates |
|---|---|---|
| panel-server | `src/lib/plugins.js` | `portlama-plugin.json` schema |
| portlama-agent | `src/lib/agent-plugins.js` | Same schema, same Zod rules |
| portlama-agent | `src/lib/local-plugins.js` | Same schema, `modes` filter differs |

Becomes a single Zod schema exported from `portlama`.

### Plugin Lifecycle (three copies) → portlama

| Package | File | Context |
|---|---|---|
| panel-server | `src/lib/plugins.js` | Server plugins in `/etc/portlama/plugins/` |
| portlama-agent | `src/lib/agent-plugins.js` | Agent plugins in `~/.portlama/agents/<label>/plugins/` |
| portlama-agent | `src/lib/local-plugins.js` | Local plugins in `~/.portlama/local/plugins/` |

All three implement: install (npm + manifest + registry), uninstall, enable, disable, update, bundle read. Differs only in data directory, mode filter, and max plugin cap. Becomes a single parameterized lifecycle module in `portlama`.

### PluginLoader React Component (two copies) → shared component in portlama-server-ui

| Package | File | Mechanism |
|---|---|---|
| portlama-admin-panel | `src/components/PluginLoader.jsx` | `<script>` tag, admin theme |
| portlama-agent-panel | `src/pages/Plugins.jsx` (AgentPluginPanel) | `new Function()`, agent theme |

Both implement `window.__portlamaPlugins[name]` mount/unmount protocol. Becomes one component with theme/fetch as props, shared between `portlama-server-ui` and `portlama-agent-ui`.

### Client Interfaces (JSDoc-only, no shared contract) → portlama

| Interface | Methods | Implementations | Typed? |
|---|---|---|---|
| AdminClient | ~130 | `web-admin-client.js`, `desktop-admin-client.js` | No (JSDoc) |
| AgentClient | ~29 | `web-agent-client.js`, `desktop-agent-client.js` | No (JSDoc) |

A method signature mismatch between web and desktop surfaces only at runtime. Becomes TypeScript interfaces in `portlama`.

### Constants & Reserved Names (duplicated) → portlama

| Constant | Current Locations |
|---|---|
| Reserved API prefixes | `panel-server/src/lib/constants.js`, `portlama-agent/src/lib/agent-plugins.js`, `portlama-agent/src/lib/local-plugins.js` |
| Curated plugin list | `portlama-desktop/src-tauri/src/local_plugins.rs`, `portlama-agent/src/lib/local-plugins.js` |
| Capability names | `panel-server/src/lib/mtls.js`, inline in route handlers |

All move to `portlama` (core lib).

## Legacy Code Paths

### Single-Agent vs Multi-Agent (desktop)

`desktop-agent-client.js` branches on whether `label` exists:

```javascript
getStatus: () => label
  ? invoke('get_agent_status', { label })
  : invoke('get_status')  // legacy single-agent
```

The Rust backend has both `commands.rs` (legacy) and `agents.rs` (multi-agent). After refactor, `commands.rs` removed entirely. Multi-agent is the only path.

### Committed Build Artifact (panel-dist/)

`portlama-agent-panel` builds to `dist-web/`, which is manually copied into `portlama-agent/panel-dist/` and committed to git. After refactor, `portlama-agent-ui` builds the SPA, `portlama-agentd` consumes it via build script. No committed artifacts.

## Execution Plan

### Phase 1: Create `portlama` core library

Create `packages/portlama/` (TypeScript) with subpath exports:

**Root (`@lamalibre/portlama`):**
- Types: `AdminClient`, `AgentClient` TypeScript interfaces, plugin manifest types, capability types
- Constants: Reserved API prefixes, curated plugin list, capability names
- Schemas: Plugin manifest Zod schema (single source of truth)
- Plugin Host: Fastify plugin for plugin route mounting, bundle serving, disabled handler (unified from three routers)
- File Helpers: Atomic write (temp → fsync → rename), promise-chain mutex

**Agent subpath (`@lamalibre/portlama/agent`):**
- Platform: Path helpers, platform detection (from `platform.js`)
- Registry: Agent registry CRUD, label validation, legacy migration (from `registry.js`)
- Config: Agent config I/O (from `config.js`)
- Service: Start/stop/status for launchctl and systemd (from `service.js`, `launchctl.js`)
- Plugins: Agent and local plugin lifecycle (unified — uses shared schema/lifecycle from root)
- Local Host Service: Service config generation and lifecycle (from `local-host-service.js`)
- Service Discovery: Port scanning, process detection, Docker discovery (new — from Rust `services.rs`)
- Server Registry: servers.json and storage-servers.json CRUD (new — from Rust `cloud.rs`)
- Mode: Server mode and admin cert file operations (new — from Rust `mode.rs`)

**Server subpath (`@lamalibre/portlama/server`):**
- Plugins: Server-side plugin lifecycle (uses shared schema from root)
- Tunnels: Tunnel creation workflow with rollback (from `routes/tunnels.js`)
- Sites: Site creation with managed/custom domain branching (from `routes/sites.js`)
- mTLS: Certificate management and rotation (from `lib/mtls.js`)
- Access Control: Authelia access control sync (from `lib/access-control-sync.js`)
- Provisioning: Provisioning orchestrator (from `routes/onboarding/provision.js`)

### Phase 2: CLIs and daemons consume core library

#### 2a: Extract `portlama-agentd` from `portlama-agent`

Split the current monolithic `portlama-agent` into two packages:

- **`portlama-agent`** (CLI only): keeps command handlers, CLI entry point, `--json` NDJSON support. Imports from `portlama/agent`. No Fastify.
- **`portlama-agentd`** (daemon only): gets Fastify REST API, plugin router, SPA serving. Imports from `portlama/agent`. No CLI argument parsing.

Both import business logic from `portlama/agent` — neither contains it.

#### 2b: `portlama-agent` CLI consumes `portlama/agent`

Refactor the extracted CLI:
- Command handlers become thin orchestrators calling `portlama/agent` functions
- `src/lib/` modules removed (logic now in core library)
- `--json` NDJSON output on all commands

#### 2c: `portlama-agentd` consumes `portlama/agent`

Refactor the extracted agent daemon:
- REST API routes become thin HTTP handlers calling `portlama/agent` functions
- Uses plugin host Fastify plugin from `portlama`
- Serves web SPA built from `portlama-agent-ui`

Add missing REST API endpoints for operations desktop currently does in Rust:
- `GET /api/agents` — list agents with status
- `POST /api/agents/:label/start` / `stop` / `restart`
- `PATCH /api/agents/current` — set current agent
- `DELETE /api/agents/:label` — remove agent
- `GET /api/local-plugins` / `POST /install` / `POST /:name/enable` / etc.
- `GET /api/local-host/status` / `POST /start` / `POST /stop`
- `GET /api/services/scan` — service discovery
- `POST /api/services/custom` — add custom service

#### 2d: Create `portlama-server` CLI (new package)

Create `packages/portlama-server/` — thin CLI that imports from `portlama/server`:

- Subcommands: `status`, `logs`, `restart`, `plugins`, `tunnels`, `sites`, `certs`, `reset-admin`, `uninstall`
- `--json` flag for NDJSON output on all commands
- Absorbs `portlama-reset-admin` standalone script
- Installed globally on the server during provisioning (`create-portlama` adds it)

#### 2e: Rename `panel-server` to `portlama-serverd`, consume `portlama/server`

Rename and refactor:
- Plugin manifest schema from `portlama`
- Plugin host Fastify plugin from `portlama`
- Constants and types from `portlama`
- Server plugin lifecycle from `portlama/server`
- Extract inline route logic to `portlama/server` functions
- Routes become thin HTTP handlers

#### 2f: Merge `panel-client` + `portlama-admin-panel` into `portlama-server-ui`

- Server/admin React components + browser SPA build in one package
- Rename `portlama-agent-panel` to `portlama-agent-ui`
- Unify PluginLoader into a single shared component

#### 2g: Rename `create-*` and `install-*` packages

- `install-portlama-agent` → `create-portlama-agent`
- `install-portlama-desktop` → `create-portlama-desktop`
- `install-portlama-admin` → `create-portlama-admin`
- `install-portlama-e2e-mcp` → `create-portlama-e2e`
- Business logic (CSR generation, cert file ops) moves from these packages into `portlama/agent`
- Packages become thin CLI wrappers with interactive UX

### Phase 3: Desktop drops Rust reimplementations

Replace Rust business logic with REST API calls to `portlama-agentd` (:9393) or CLI subprocess spawns of `portlama-agent`:

| Current Rust | Replacement | Via |
|---|---|---|
| `agents.rs` registry CRUD | `portlama-agentd` REST API | REST to :9393 |
| `agents.rs` service start/stop | `portlama-agentd` REST API | REST to :9393 |
| `local_plugins.rs` all operations | `portlama-agentd` REST API | REST to :9393 or :9293 |
| `commands.rs` legacy operations | Remove entirely | Multi-agent only |
| `services.rs` scan/registry | `portlama-agentd` REST API | REST to :9393 |
| `mode.rs` server mode | `portlama-agent` CLI subprocess | subprocess `--json` |
| `cloud.rs` server/storage registry | `portlama-agent` CLI subprocess | subprocess `--json` |

Rust files that remain:
- `api.rs` — curl helpers (still needed for portlama-serverd mTLS calls)
- `admin_commands.rs` — REST API delegation to portlama-serverd (already correct)
- `credentials.rs` — OS credential store (desktop-only)
- `tray.rs` — system tray (desktop-only)
- `user_access.rs` — deep link handling (desktop-only)
- `local_install.rs` — pkexec subprocess (desktop-only)
- `upgrade_admin.rs` — CLI subprocess (already correct pattern)

### Phase 4: Cleanup

- Remove `commands.rs` (legacy single-agent)
- Remove legacy branching in `desktop-agent-client.js`
- No more committed `panel-dist/` — built from `portlama-agent-ui` as part of `portlama-agentd` build
- Remove standalone `portlama-reset-admin` script (absorbed into `portlama-server reset-admin`)
- Add TypeScript interface checks to CI (web and desktop clients must implement the full interface)
- Verify isolation: `portlama/agent` cannot import `portlama/server` and vice versa
- Verify CLI packages have no Fastify dependency
- Verify daemon packages have no CLI argument parsing dependency
- All packages at 2.0.0, published to Feria for validation before npm
- Feria itself is out of scope — do not modify, will be addressed separately

## Reference: What Already Works

`portlama-cloud` follows the ideal pattern and should serve as the template:

```
portlama-cloud/src/lib/     → Business logic (provisioner, discoverer, updater)
portlama-cloud/src/cli.js   → Thin CLI with --json NDJSON output
portlama-desktop/cloud.rs   → Spawns CLI subprocess, parses NDJSON events
```

This is what every domain in the codebase should look like. After refactor:

```
portlama/src/                   → Shared types, constants, schemas, plugin host
portlama/src/agent/             → Agent business logic (registry, service, plugins)
portlama/src/server/            → Server business logic (mTLS, tunnels, sites, plugins)

portlama-agent/src/             → Thin agent CLI (no Fastify)
portlama-agentd/src/            → Agent REST API daemon on :9393 (no CLI)
portlama-agent-ui/src/          → Agent React components + browser SPA

portlama-server/src/            → Thin server CLI (no Fastify)
portlama-serverd/src/           → Server REST API daemon on :3100 (no CLI)
portlama-server-ui/src/         → Server/admin React components + browser SPA

portlama-desktop/src-tauri/     → Tauri shell (credentials, tray, deep links — no business logic)
portlama-desktop/src/agent/     → Imports portlama-agent-ui
portlama-desktop/src/server/    → Imports portlama-server-ui
```
