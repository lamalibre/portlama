# setup-host

> Started at `2026-03-20 11:02:43 UTC` — log level **1**


---

# Portlama E2E — Host VM Setup


| Key | Value |
|-----|-------|
| **Host IP** | `192.168.2.94` |
| **Test Domain** | `test.portlama.local` |
| **Scripts** | `/tmp/e2e` |

🔵 `11:02:43` **[1/10] Configuring system DNS...**  
<details>
<summary>✅ <code>11:02:43</code> Stop systemd-resolved</summary>

```
$ systemctl stop systemd-resolved

```
</details>

<details>
<summary>✅ <code>11:02:43</code> Disable systemd-resolved</summary>

```
$ systemctl disable systemd-resolved
Removed "/etc/systemd/system/dbus-org.freedesktop.resolve1.service".
Removed "/etc/systemd/system/sysinit.target.wants/systemd-resolved.service".
```
</details>

✅ `11:02:43` Disabled systemd-resolved  
✅ `11:02:43` System DNS configured  
🔵 `11:02:43` **[2/10] Installing dnsmasq...**  
<details>
<summary>✅ <code>11:02:44</code> apt-get update</summary>

```
$ apt-get update -qq

```
</details>

<details>
<summary>✅ <code>11:02:50</code> Install dnsmasq, jq, oathtool, and sqlite3</summary>

```
$ apt-get install -y -qq dnsmasq jq oathtool sqlite3
debconf: unable to initialize frontend: Dialog
debconf: (Dialog frontend will not work on a dumb terminal, an emacs shell buffer, or without a controlling terminal.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (This frontend requires a controlling tty.)
debconf: falling back to frontend: Teletype
dpkg-preconfigure: unable to re-open stdin: 
Selecting previously unselected package dnsmasq-base.
(Reading database ... (Reading database ... 5%(Reading database ... 10%(Reading database ... 15%(Reading database ... 20%(Reading database ... 25%(Reading database ... 30%(Reading database ... 35%(Reading database ... 40%(Reading database ... 45%(Reading database ... 50%(Reading database ... 55%(Reading database ... 60%(Reading database ... 65%(Reading database ... 70%(Reading database ... 75%(Reading database ... 80%(Reading database ... 85%(Reading database ... 90%(Reading database ... 95%(Reading database ... 100%(Reading database ... 102268 files and directories currently installed.)
Preparing to unpack .../0-dnsmasq-base_2.90-2ubuntu0.1_arm64.deb ...
Unpacking dnsmasq-base (2.90-2ubuntu0.1) ...
Selecting previously unselected package dnsmasq.
Preparing to unpack .../1-dnsmasq_2.90-2ubuntu0.1_all.deb ...
Unpacking dnsmasq (2.90-2ubuntu0.1) ...
Selecting previously unselected package dns-root-data.
Preparing to unpack .../2-dns-root-data_2024071801~ubuntu0.24.04.1_all.deb ...
Unpacking dns-root-data (2024071801~ubuntu0.24.04.1) ...
Selecting previously unselected package liboath0t64:arm64.
Preparing to unpack .../3-liboath0t64_2.6.11-2.1ubuntu0.1_arm64.deb ...
Unpacking liboath0t64:arm64 (2.6.11-2.1ubuntu0.1) ...
Selecting previously unselected package oathtool.
Preparing to unpack .../4-oathtool_2.6.11-2.1ubuntu0.1_arm64.deb ...
Unpacking oathtool (2.6.11-2.1ubuntu0.1) ...
Selecting previously unselected package sqlite3.
Preparing to unpack .../5-sqlite3_3.45.1-1ubuntu2.5_arm64.deb ...
Unpacking sqlite3 (3.45.1-1ubuntu2.5) ...
Setting up dnsmasq-base (2.90-2ubuntu0.1) ...
Setting up dns-root-data (2024071801~ubuntu0.24.04.1) ...
Setting up dnsmasq (2.90-2ubuntu0.1) ...
Created symlink /etc/systemd/system/multi-user.target.wants/dnsmasq.service → /usr/lib/systemd/system/dnsmasq.service.
Setting up liboath0t64:arm64 (2.6.11-2.1ubuntu0.1) ...
Setting up sqlite3 (3.45.1-1ubuntu2.5) ...
Setting up oathtool (2.6.11-2.1ubuntu0.1) ...
Processing triggers for dbus (1.14.10-4ubuntu4.1) ...
Processing triggers for libc-bin (2.39-0ubuntu8.7) ...
Processing triggers for man-db (2.12.0-4build2) ...
debconf: unable to initialize frontend: Dialog
debconf: (Dialog frontend will not work on a dumb terminal, an emacs shell buffer, or without a controlling terminal.)
debconf: falling back to frontend: Readline
debconf: unable to initialize frontend: Readline
debconf: (This frontend requires a controlling tty.)
debconf: falling back to frontend: Teletype

Running kernel seems to be up-to-date.

No services need to be restarted.

No containers need to be restarted.

No user sessions are running outdated binaries.

No VM guests are running outdated hypervisor (qemu) binaries on this host.
```
</details>

<details>
<summary>✅ <code>11:02:50</code> Restart dnsmasq</summary>

```
$ systemctl restart dnsmasq

```
</details>

<details>
<summary>✅ <code>11:02:51</code> Enable dnsmasq</summary>

```
$ systemctl enable dnsmasq
Synchronizing state of dnsmasq.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install enable dnsmasq
```
</details>

✅ `11:02:51` DNS verified: test.portlama.local -> 192.168.2.94  
🔵 `11:02:51` **[3/10] Installing certbot shim...**  
✅ `11:02:51` certbot shim installed at /usr/bin/certbot  
🔵 `11:02:51` **[4/10] Creating dummy certbot.timer...**  
<details>
<summary>✅ <code>11:02:51</code> Reload systemd daemon</summary>

```
$ systemctl daemon-reload

```
</details>

<details>
<summary>✅ <code>11:02:51</code> Enable certbot.timer</summary>

```
$ systemctl enable certbot.timer

```
</details>

<details>
<summary>✅ <code>11:02:51</code> Start certbot.timer</summary>

```
$ systemctl start certbot.timer

```
</details>

✅ `11:02:51` certbot.timer created and started  
🔵 `11:02:51` **[5/10] Waiting for panel server to be ready...**  
✅ `11:02:51` Panel server is ready  
🔵 `11:02:51` **[6/10] Running onboarding — setting domain...**  
✅ `11:02:51` Domain set to test.portlama.local  
ℹ️ `11:02:51` Verifying DNS...  
✅ `11:02:51` DNS verified  
ℹ️ `11:02:51` Starting provisioning...  
ℹ️ `11:02:51` Provisioning started, polling for completion...  
✅ `11:03:02` Provisioning completed  
🔵 `11:03:02` **[7/10] Creating test user...**  
✅ `11:03:04` Test user created (testuser / TestPassword-E2E-123)  
🔵 `11:03:04` **[8/10] Generating agent certificate...**  
✅ `11:03:05` Agent certificate generated (label: test-agent)  
🔵 `11:03:05` **[9/10] Saving credentials...**  
✅ `11:03:05` Credentials saved to /tmp/portlama-test-credentials.json  
🔵 `11:03:05` **[10/10] Setup complete!**  

---

# Host VM Setup Summary


| Key | Value |
|-----|-------|
| **Host IP** | `192.168.2.94` |
| **Test Domain** | `test.portlama.local` |
| **Panel URL (IP)** | `https://192.168.2.94:9292` |
| **Panel URL (DNS)** | `https://panel.test.portlama.local` |
| **Auth URL** | `https://auth.test.portlama.local` |
| **Tunnel URL** | `https://tunnel.test.portlama.local` |
| **Test User** | `testuser / TestPassword-E2E-123` |
| **Agent Label** | `test-agent` |
| **Agent P12 Pass** | `7e65c112a480ad57665ceb3f07b82f22` |
| **Credentials file** | `/tmp/portlama-test-credentials.json` |
| **Agent P12 file** | `/etc/portlama/pki/agents/test-agent/client.p12` |
| **Log file** | `/tmp/setup-host.md` |

ℹ️ `11:03:05` Next: transfer agent P12 + credentials to the agent VM, then run setup-agent.sh on the agent VM.  
