# orchestrate

> Started at `2026-03-25 09:19:02 UTC` — log level **1**


## Preflight checks

✅ `09:19:02` Required tools available  

---

# Portlama Three-VM E2E Test Orchestrator


| Key | Value |
|-----|-------|
| **Test Domain** | `test.portlama.local` |
| **VM Specs** | `1 vCPU, 512M RAM, 10G disk` |
| **Cleanup** | `false` |
| **Skip Create** | `true` |
| **Skip Setup** | `false` |
| **Skip Single** | `false` |
| **Skip Multi** | `false` |
| **Log Level** | `1` |
| **Log Dir** | `<repo>/e2e-logs` |
| **Date** | `2026-03-25 09:19:02 UTC` |


## Phase 1: Skipping VM creation (--skip-create)

ℹ️ `09:19:03` Host IP:    192.168.2.237  
ℹ️ `09:19:03` Agent IP:   192.168.2.236  
ℹ️ `09:19:03` Visitor IP: 192.168.2.235  

## Phase 2: Setting up VMs

🔵 `09:19:03` **Packing create-portlama tarball...**  
✅ `09:19:03` Tarball ready: /tmp/lamalibre-create-portlama-1.0.30.tgz  
🔵 `09:19:03` **Packing portlama-agent tarball...**  
✅ `09:19:03` Agent tarball ready: /tmp/lamalibre-portlama-agent-1.0.8.tgz  
🔵 `09:19:03` **Installing npm on portlama-host...**  
<details>
<summary>✅ <code>09:19:04</code> apt install npm on portlama-host</summary>

```
$ multipass exec portlama-host -- sudo apt-get install -y npm
Reading package lists...
Building dependency tree...
Reading state information...
npm is already the newest version (9.2.0~ds1-2).
0 upgraded, 0 newly installed, 0 to remove and 13 not upgraded.
```
</details>

🔵 `09:19:04` **Transferring installer tarball to portlama-host...**  
✅ `09:19:04` Tarball transferred  
🔵 `09:19:04` **Installing create-portlama from tarball on portlama-host...**  
<details>
<summary>✅ <code>09:19:06</code> npm install -g tarball on portlama-host</summary>

```
$ multipass exec portlama-host -- sudo npm install -g /tmp/create-portlama.tgz
npm WARN EBADENGINE Unsupported engine {
npm WARN EBADENGINE   package: '@lamalibre/create-portlama@1.0.30',
npm WARN EBADENGINE   required: { node: '>=20.0.0' },
npm WARN EBADENGINE   current: { node: 'v18.19.1', npm: '9.2.0' }
npm WARN EBADENGINE }

added 48 packages in 2s

34 packages are looking for funding
  run `npm fund` for details
```
</details>

🔵 `09:19:06` **Running create-portlama on portlama-host...**  
✅ `09:19:51` Portlama installed on portlama-host  
🔵 `09:19:51` **Transferring test scripts to VMs...**  
✅ `09:19:56` Test scripts transferred to all VMs  
🔵 `09:19:56` **Running setup-host.sh on portlama-host...**  
✅ `09:20:17` Host VM setup complete  
ℹ️ `09:20:17` Extracting credentials from portlama-host...  
✅ `09:20:17` Credentials extracted (agent P12 password obtained)  
🔵 `09:20:17` **Creating enrollment token on portlama-host...**  
✅ `09:20:17` Enrollment token created  
ℹ️ `09:20:17` Transferring portlama-agent tarball to portlama-agent...  
✅ `09:20:17` Agent tarball transferred  
🔵 `09:20:17` **Running setup-agent.sh on portlama-agent...**  
✅ `09:20:37` Agent VM setup complete  
🔵 `09:20:37` **Running setup-visitor.sh on portlama-visitor...**  
✅ `09:20:43` Visitor VM setup complete  

## Phase 3: Running single-VM E2E tests on portlama-host

ℹ️ `09:20:43` Transferring single-VM E2E test scripts to portlama-host...  
✅ `09:20:45` Single-VM test scripts transferred  
ℹ️ `09:20:45` Running tests/e2e/run-all.sh on portlama-host...  
ℹ️ `09:21:37` Collecting per-test log files from portlama-host...  
✅ `09:21:40` Single-VM E2E tests passed  

## Phase 4: Running three-VM E2E tests from macOS

ℹ️ `09:21:40` Environment:  
ℹ️ `09:21:40`   HOST_IP=192.168.2.237  
ℹ️ `09:21:40`   AGENT_IP=192.168.2.236  
ℹ️ `09:21:40`   VISITOR_IP=192.168.2.235  
ℹ️ `09:21:40`   TEST_DOMAIN=test.portlama.local  
ℹ️ `09:21:40`   TEST_USER=testuser  
✅ `09:24:52` Three-VM E2E tests passed  

---

# Test Orchestration Summary


| Key | Value |
|-----|-------|
| **VMs** | `portlama-host (192.168.2.237), portlama-agent (192.168.2.236), portlama-visitor (192.168.2.235)` |
| **Test Domain** | `test.portlama.local` |

✅ `09:24:52` Single-VM E2E: PASSED  
✅ `09:24:52` Three-VM E2E: PASSED  

## Log files


| Key | Value |
|-----|-------|
| **Orchestrator** | `<repo>/e2e-logs/orchestrate.md` |
| **setup-agent** | `<repo>/e2e-logs/setup-agent.md` |
| **setup-host** | `<repo>/e2e-logs/setup-host.md` |
| **setup-visitor** | `<repo>/e2e-logs/setup-visitor.md` |
| **single-test-01-fresh-install** | `<repo>/e2e-logs/single-test-01-fresh-install.md` |
| **single-test-02-mtls-enforcement** | `<repo>/e2e-logs/single-test-02-mtls-enforcement.md` |
| **single-test-03-onboarding-flow** | `<repo>/e2e-logs/single-test-03-onboarding-flow.md` |
| **single-test-04-tunnel-lifecycle** | `<repo>/e2e-logs/single-test-04-tunnel-lifecycle.md` |
| **single-test-05-user-lifecycle** | `<repo>/e2e-logs/single-test-05-user-lifecycle.md` |
| **single-test-06-service-control** | `<repo>/e2e-logs/single-test-06-service-control.md` |
| **single-test-07-cert-renewal** | `<repo>/e2e-logs/single-test-07-cert-renewal.md` |
| **single-test-08-mtls-rotation** | `<repo>/e2e-logs/single-test-08-mtls-rotation.md` |
| **single-test-09-ip-fallback** | `<repo>/e2e-logs/single-test-09-ip-fallback.md` |
| **single-test-10-resilience** | `<repo>/e2e-logs/single-test-10-resilience.md` |
| **single-test-11-input-validation** | `<repo>/e2e-logs/single-test-11-input-validation.md` |
| **single-test-12-user-invitations** | `<repo>/e2e-logs/single-test-12-user-invitations.md` |
| **single-test-13-site-lifecycle** | `<repo>/e2e-logs/single-test-13-site-lifecycle.md` |
| **single-test-15-plugin-lifecycle** | `<repo>/e2e-logs/single-test-15-plugin-lifecycle.md` |
| **single-test-16-enrollment-tokens** | `<repo>/e2e-logs/single-test-16-enrollment-tokens.md` |
| **single-vm-e2e** | `<repo>/e2e-logs/single-vm-e2e.md` |
| **test-01-onboarding-complete** | `<repo>/e2e-logs/test-01-onboarding-complete.md` |
| **test-02-tunnel-traffic** | `<repo>/e2e-logs/test-02-tunnel-traffic.md` |
| **test-03-tunnel-toggle-traffic** | `<repo>/e2e-logs/test-03-tunnel-toggle-traffic.md` |
| **test-04-authelia-auth** | `<repo>/e2e-logs/test-04-authelia-auth.md` |
| **test-05-admin-journey** | `<repo>/e2e-logs/test-05-admin-journey.md` |
| **test-06-tunnel-user-journey** | `<repo>/e2e-logs/test-06-tunnel-user-journey.md` |
| **test-07-site-visitor-journey** | `<repo>/e2e-logs/test-07-site-visitor-journey.md` |
| **test-08-invitation-journey** | `<repo>/e2e-logs/test-08-invitation-journey.md` |
| **test-09-agent-site-deploy** | `<repo>/e2e-logs/test-09-agent-site-deploy.md` |
| **test-11-plugin-lifecycle** | `<repo>/e2e-logs/test-11-plugin-lifecycle.md` |
| **test-12-enrollment-lifecycle** | `<repo>/e2e-logs/test-12-enrollment-lifecycle.md` |
| **three-vm-e2e** | `<repo>/e2e-logs/three-vm-e2e.md` |

ℹ️ `09:24:52` VMs kept for debugging. Delete manually with:  
ℹ️ `09:24:52`   multipass delete portlama-host portlama-agent portlama-visitor && multipass purge  
✅ `09:24:52` OVERALL: PASSED  
