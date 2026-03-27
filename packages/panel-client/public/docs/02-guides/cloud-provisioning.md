# Cloud Provisioning

> Create a Portlama server on DigitalOcean directly from the desktop app — no SSH, no terminal commands, no manual configuration.

## In Plain English

The traditional way to set up Portlama involves SSH-ing into a VPS and running an installer command. Cloud provisioning eliminates all of that. You open the desktop app, paste a DigitalOcean API token, pick a region, and click a button. Five minutes later, you have a fully configured Portlama server with your certificate already installed.

Behind the scenes, the app creates a droplet, installs Portlama over SSH using a temporary key (which is deleted afterward), downloads your admin certificate, and stores your credentials securely in your operating system's credential store (macOS Keychain or Linux libsecret). You never see an SSH session, and no secrets are stored in plaintext files.

## Prerequisites

Before you start, make sure you have:

| Requirement              | Details                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| **Desktop app installed** | `npx @lamalibre/install-portlama-desktop` ([setup guide](desktop-app-setup.md))    |
| **DigitalOcean account** | A free account at [cloud.digitalocean.com](https://cloud.digitalocean.com). **If you have other infrastructure on DO, create a dedicated team first** (see below) |
| **Payment method**       | A credit card or PayPal on file in DigitalOcean (required to create droplets)       |
| **Domain name**          | Optional for initial setup — you can add a domain later through the panel           |

**Cost:** $4/month for the droplet (512MB RAM, 1 vCPU, 10GB SSD). This is the smallest DigitalOcean droplet and is all Portlama needs.

---

## Step 1: Create a DigitalOcean API Token

Portlama needs an API token to create and manage droplets on your behalf. The token must have exactly the right permissions — too few and provisioning fails, too many and the app rejects it for safety.

### Use a dedicated DigitalOcean team (strongly recommended)

DigitalOcean API tokens are account-wide — a token with `droplet:delete` can delete *any* droplet in the account, not just ones created by Portlama. While the app enforces a `portlama:managed` tag check before destroying a droplet, that is an application-level guard. The token itself still has API-level access to all droplets.

**If you have other infrastructure on DigitalOcean (databases, Kubernetes clusters, production droplets, etc.), create a separate DigitalOcean team for Portlama.** This is the only way to get true resource-level isolation:

1. Go to **Settings → Team** in the DigitalOcean console
2. Click **Create a Team**
3. Name it something like "Portlama" and add your account
4. Switch to the new team context (top-left dropdown in the DO console)
5. Create the API token *within this team*

Tokens created in the Portlama team can only see and manage resources that belong to that team. Even if the token were compromised, it could not touch any resources in your main account or other teams. This is the strongest isolation DigitalOcean offers and costs nothing extra.

> **If you are the only one using your DigitalOcean account and have no other infrastructure there, a separate team is optional.** The custom-scoped token described below is sufficient. But if there is anything else in the account you care about, use a team.

### Creating the token

1. Log in to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. **Switch to your Portlama team** if you created one (top-left dropdown)
3. Go to **API** in the left sidebar (or navigate directly to [cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens))
4. Click **Generate New Token**
5. Give it a name you will recognize (e.g., "Portlama Desktop")
6. Set the expiration to your preference (90 days is a good balance)
7. Under **Custom Scopes**, select these 5 resource groups:

| Resource group | Scopes granted                                    | Why Portlama needs it                                 |
| -------------- | ------------------------------------------------- | ----------------------------------------------------- |
| **account**    | `read`                                            | Validate the token and display your account email     |
| **droplet**    | `create`, `read`, `update`, `delete`, `admin`     | Create, monitor, and destroy the server               |
| **regions**    | `read`                                            | List available regions and measure latency            |
| **ssh_key**    | `create`, `read`, `update`, `delete`              | Upload a temporary SSH key for installation           |
| **tag**        | `create`, `read`, `delete`                        | Tag managed droplets with `portlama:managed`          |

> **Note:** DigitalOcean's custom scopes UI works at the resource level — you cannot select individual sub-scopes (e.g., `droplet:create` alone). Selecting "droplet" grants all 5 droplet sub-scopes. DO also auto-adds read-only dependency scopes (`sizes:read`, `actions:read`, `image:read`, `snapshot:read`, `vpc:read`). This is normal. Your token will show about 20 total scopes. The app expects this and will not reject these extra scopes — only scopes like `database:delete`, `kubernetes:create`, or `account:write` are rejected.

8. Click **Generate Token**
9. **Copy the token immediately** — DigitalOcean only shows it once

> **Do not use a full-access token.** The app intentionally rejects tokens with dangerous scopes like `account:write`, `database:create`, `firewall:delete`, `kubernetes:create`, `volume:create`, etc. This is a safety measure — Portlama should never have permission to touch your databases, Kubernetes clusters, or account settings. If you see a "dangerous excess scopes" warning, create a new token with only the 5 resource groups listed above.

### Isolation summary

The combination of a dedicated team and custom-scoped token provides two layers of isolation:

| Layer                        | What it protects against                                    |
| ---------------------------- | ----------------------------------------------------------- |
| **Dedicated team**           | Token cannot see or touch resources outside the team        |
| **Custom scopes (7 only)**   | Token cannot manage databases, firewalls, Kubernetes, etc.  |
| **`portlama:managed` tag**   | App-level guard: refuses to destroy untagged droplets       |
| **Dangerous scope rejection** | App rejects tokens that are overly broad                   |

### Where the token is stored

The token is stored in your operating system's credential store:

- **macOS:** Keychain (service: `com.portlama.cloud`)
- **Linux:** libsecret / GNOME Keyring (via `secret-tool`)

The token is never written to a file on disk and never passed as a command-line argument (which would be visible in process listings). When the app needs to use the token, it reads it from the credential store and passes it to the provisioning process via an environment variable.

---

## Step 2: Open the Server Wizard

1. Open the Portlama desktop app
2. Navigate to the **Servers** tab (cloud icon in the sidebar)
3. Click **Create New Server** (or, if this is your first time and no servers exist, click the "Create a new server" button in the center of the page)

The wizard opens with four steps shown in a breadcrumb bar: **Token → Region → Label → Create**.

---

## Step 3: Validate Your Token

1. Paste your DigitalOcean API token into the token field
   - If you previously saved a token, the field shows "Token saved in keychain" — you can leave it blank to reuse the saved token
2. Click **Validate**

The app checks three things:

- **Is the token valid?** — It calls the DigitalOcean API to verify the token works and reads your account email
- **Does it have all required scopes?** — All 4 resource groups listed above must be present
- **Does it have dangerous scopes?** — Scopes like `account:write` or `database:delete` cause rejection

### What you will see

**If the token is valid:**

A green checkmark appears with your DigitalOcean account email. The **Next** button becomes active.

**If scopes are missing:**

A red message lists the missing scopes. Go back to DigitalOcean and create a new token with all 4 required resource groups.

**If dangerous scopes are detected:**

An amber warning lists the excess scopes. This means you used a full-access or overly broad token. Create a new token with custom scopes — only the 7 listed above.

---

## Step 4: Choose a Region

After validating your token, click **Next**. The app fetches all DigitalOcean regions and measures the network latency from your machine to each one.

You will see a grid of region cards, each showing:

- **Region name** (e.g., Frankfurt 1, New York 1, Singapore 1)
- **Region slug** (e.g., `fra1`, `nyc1`, `sgp1`)
- **Latency** in milliseconds

The regions are sorted by latency — the fastest one is at the top and is auto-selected. Pick the region closest to your users (or closest to you, if you are the only user).

> **Tip:** If you are in Europe, `fra1` or `ams3` are usually the fastest. In the US, `nyc1`, `nyc3`, or `sfo3`. In Asia-Pacific, `sgp1` or `blr1`.

Only regions that support the $4 droplet size (`s-1vcpu-512mb-10gb`) are shown. If a region does not support this size, it is filtered out automatically.

---

## Step 5: Name Your Server

Enter a label for your server. This is a short name used to identify the server in the app and on DigitalOcean.

**Rules:**
- Lowercase letters, numbers, and hyphens only
- Must start with a letter or number
- Maximum 64 characters

If you leave it blank, it defaults to `portlama-{region}` (e.g., `portlama-fra1`).

A summary box shows what will be created:

- **Size:** 512MB RAM / 1 vCPU / 10GB SSD ($4/month)
- **Image:** Ubuntu 24.04 LTS
- **Region:** Your selected region

Click **Create Server** to begin provisioning.

---

## Step 6: Watch the Provisioning

The wizard shows 11 steps with live progress indicators. Each step shows a spinning cyan icon while in progress, a green checkmark when complete, or a red X if something fails.

| Step                        | What happens                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------- |
| **Validating token**        | Re-verifies the API token (defense in depth)                                        |
| **Generating SSH key**      | Creates a temporary ed25519 keypair (used only for this installation, then deleted) |
| **Uploading SSH key**       | Uploads the public key to your DigitalOcean account                                 |
| **Creating droplet**        | Creates the $4 droplet with Ubuntu 24.04 and the `portlama:managed` tag             |
| **Waiting for boot**        | Polls DigitalOcean until the droplet has a public IP and is ready (up to 5 minutes) |
| **Connecting via SSH**      | Establishes an SSH connection using the temporary key                               |
| **Installing Portlama**     | Runs `npx @lamalibre/create-portlama` on the droplet (up to 10 minutes)             |
| **Retrieving credentials**  | Downloads the admin certificate (`.p12` file) from the droplet                      |
| **Enrolling admin certificate** | Imports the certificate into your OS credential store                           |
| **Saving configuration**    | Writes the server entry to `~/.portlama/servers.json`                               |
| **Cleaning up**             | Deletes the temporary SSH key from DigitalOcean and your machine                    |

The entire process typically takes 3–5 minutes, depending on the region and network conditions.

> **Do not close the wizard during provisioning.** The close button is disabled while provisioning is in progress. If something goes wrong, the app automatically cleans up — destroying the droplet, removing the SSH key, and deleting temporary files.

### Certificate enrollment by platform

- **macOS:** The app generates a hardware-bound certificate in your Keychain. The private key is marked as non-extractable — it cannot be exported or copied. This is the most secure option.
- **Linux:** The app saves the `.p12` certificate file to `~/.portlama/servers/{id}/client.p12`. The P12 password is stored in libsecret, not in any file.

### When provisioning completes

A green success message appears. Click **Done** to close the wizard. Your new server appears in the Servers list as the active server, and the app automatically connects to it.

### If provisioning fails

A red error message appears below the step that failed. The app runs cleanup automatically:

1. Destroys the droplet (if it was created)
2. Removes the SSH key from DigitalOcean (if it was uploaded)
3. Deletes local temporary files

You can click **Retry** to start over from the beginning, or close the wizard and try again later.

Common failure causes:

| Error                                        | Likely cause                                                   |
| -------------------------------------------- | -------------------------------------------------------------- |
| Token validation failed                      | Token expired or scopes changed since step 1                   |
| Droplet creation failed                      | DigitalOcean account limit reached or payment issue             |
| Timed out waiting for boot                   | Rare DigitalOcean infrastructure delay — retry usually works   |
| SSH connection failed                        | Firewall or network issue between your machine and the droplet |
| Installation failed                          | Transient npm registry issue — retry usually works             |
| Another provisioning operation is in progress | A previous provisioning attempt is still running               |

---

## After Provisioning

### What you have now

- A DigitalOcean droplet running Portlama, accessible at `https://<ip>:9292`
- Your admin certificate installed in your OS credential store
- The server registered in the desktop app as the active server

### Next steps

1. **Complete onboarding** — Click the **Panel** button on the server card to open the admin panel in your browser. The onboarding wizard will walk you through setting up your domain and provisioning the tunnel stack (Chisel, Authelia, Let's Encrypt).

2. **Create your first tunnel** — After onboarding, go to the **Tunnels** tab in the desktop app to expose a local service.

3. **Discover services** — The **Services** tab auto-detects running services (Ollama, PostgreSQL, Docker containers, etc.) and lets you expose them with one click.

---

## Managing Multiple Servers

The desktop app supports managing multiple Portlama servers from a single interface.

### Switching servers

Each server card shows a **Set Active** button. Click it to switch the app's active connection to that server. The switch is instant — the app reloads its configuration to point at the new server.

Only one server can be active at a time. The active server is indicated by a cyan "Active" badge on its card.

### Server health monitoring

Each server card shows an online/offline status indicator (green or red dot). The app checks server health every 30 seconds by pinging the panel's `/api/health` endpoint. If a server is offline, the dot turns red — this does not affect other servers.

### Opening the panel

Click the **Panel** button on any server card to open that server's admin panel in your browser. This works regardless of which server is currently active in the app.

---

## Adding an Existing Server

If you already have a Portlama server set up (via the manual SSH method), you can add it to the desktop app without cloud provisioning.

1. Go to the **Servers** tab
2. Click **Add Existing Server** (from the dropdown or the empty-state button)
3. Enter the **Panel URL** (e.g., `https://203.0.113.42:9292`)
   - Must use HTTPS
   - Private/reserved IP addresses are blocked (localhost, 10.x, 192.168.x, etc.)
4. Optionally enter a **Label** (defaults to the hostname)
5. Click **Add Server**

The app checks that the panel is reachable before adding it. The server is added with `active: false` — click **Set Active** on its card to start using it.

> **Note:** Adding an existing server registers it in the app but does not configure authentication. You will still need to set up your agent certificate separately using `npx @lamalibre/portlama-agent setup` or by importing a certificate manually.

---

## Destroying a Server

### Cloud-provisioned servers

For servers created through the app (with a DigitalOcean provider ID):

1. Click **Destroy** on the server card
2. Confirm by clicking **Yes** in the inline confirmation

This destroys the DigitalOcean droplet, removes the server from the registry, and deletes the stored credentials. The action is irreversible — all data on the droplet is permanently deleted.

> **Safety:** The app only destroys droplets tagged with `portlama:managed`. If you manually removed this tag from the droplet in the DigitalOcean console, the destroy command will refuse to proceed. In that case, delete the droplet manually in the DigitalOcean console and use **Remove** in the app to clean up the registry entry.

### Manually added servers

For servers added via "Add Existing Server" (no provider ID):

1. Click **Remove** on the server card
2. Confirm by clicking **Yes**

This only removes the server from the desktop app's registry. The actual server is not affected — it continues running. Stored credentials for the server are cleaned up from the OS credential store.

---

## Credential Storage Reference

All sensitive credentials are stored in your operating system's credential store, never in plaintext files:

| Credential           | Service name           | Key                    | Platform                            |
| -------------------- | ---------------------- | ---------------------- | ----------------------------------- |
| DigitalOcean API token | `com.portlama.cloud` | `digitalocean`         | macOS Keychain / Linux libsecret    |
| P12 password (per server) | `com.portlama.server` | Server UUID        | macOS Keychain / Linux libsecret    |

On macOS, the `security-framework` Rust crate accesses the Keychain directly (no CLI, no process listing exposure). On Linux, `secret-tool` is used with secrets passed via stdin.

---

## Quick Reference

| Action                    | How                                                            |
| ------------------------- | -------------------------------------------------------------- |
| **Create new server**     | Servers tab → Create New Server → wizard                       |
| **Add existing server**   | Servers tab → Add Existing Server → enter URL                  |
| **Switch active server**  | Click "Set Active" on server card                              |
| **Open admin panel**      | Click "Panel" on server card                                   |
| **Destroy cloud server**  | Click "Destroy" on server card → confirm                       |
| **Remove managed server** | Click "Remove" on server card → confirm                        |
| **Server registry file**  | `~/.portlama/servers.json`                                     |
| **Token storage**         | OS credential store (`com.portlama.cloud`)                     |
| **Required DO scopes**    | `droplet:create/read/delete`, `ssh_key:create/read/delete`, `tag:create/read`, `regions:read` |

### Related Documentation

- [Desktop App Setup](desktop-app-setup.md) — installing and configuring the desktop app
- [Quick Start](../00-introduction/quickstart.md) — manual server setup via SSH
- [Certificate Management](certificate-management.md) — generating and managing certificates
- [First Tunnel](first-tunnel.md) — creating your first tunnel after server setup
