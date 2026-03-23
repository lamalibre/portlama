# orchestrate

> Started at `2026-03-23 18:40:50 UTC` — log level **1**


## Preflight checks

✅ `18:40:50` Required tools available  

---

# Portlama Three-VM E2E Test Orchestrator


| Key | Value |
|-----|-------|
| **Test Domain** | `test.portlama.local` |
| **VM Specs** | `1 vCPU, 512M RAM, 10G disk` |
| **Cleanup** | `false` |
| **Skip Create** | `true` |
| **Skip Setup** | `true` |
| **Skip Single** | `false` |
| **Skip Multi** | `false` |
| **Log Level** | `1` |
| **Log Dir** | `<repo>/e2e-logs` |
| **Date** | `2026-03-23 18:40:50 UTC` |


## Phase 1: Skipping VM creation (--skip-create)

ℹ️ `18:40:50` Host IP:    192.168.2.197  
ℹ️ `18:40:50` Agent IP:   192.168.2.198  
ℹ️ `18:40:50` Visitor IP: 192.168.2.199  

## Phase 2: Skipping setup (--skip-setup)


## Phase 3: Running single-VM E2E tests on portlama-host

ℹ️ `18:40:50` Transferring single-VM E2E test scripts to portlama-host...  
✅ `18:40:52` Single-VM test scripts transferred  
ℹ️ `18:40:52` Running tests/e2e/run-all.sh on portlama-host...  
ℹ️ `18:41:51` Collecting per-test log files from portlama-host...  
✅ `18:41:54` Single-VM E2E tests passed  

## Phase 4: Running three-VM E2E tests from macOS

ℹ️ `18:41:54` Environment:  
ℹ️ `18:41:54`   HOST_IP=192.168.2.197  
ℹ️ `18:41:54`   AGENT_IP=192.168.2.198  
ℹ️ `18:41:54`   VISITOR_IP=192.168.2.199  
ℹ️ `18:41:54`   TEST_DOMAIN=test.portlama.local  
ℹ️ `18:41:54`   TEST_USER=testuser  
✅ `18:46:07` Three-VM E2E tests passed  

---

# Test Orchestration Summary


| Key | Value |
|-----|-------|
| **VMs** | `portlama-host (192.168.2.197), portlama-agent (192.168.2.198), portlama-visitor (192.168.2.199)` |
| **Test Domain** | `test.portlama.local` |

✅ `18:46:07` Single-VM E2E: PASSED  
✅ `18:46:07` Three-VM E2E: PASSED  

## Log files


| Key | Value |
|-----|-------|
| **Orchestrator** | `<repo>/e2e-logs/orchestrate.md` |
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
| **single-test-14-shell-lifecycle** | `<repo>/e2e-logs/single-test-14-shell-lifecycle.md` |
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
| **test-10-shell-lifecycle** | `<repo>/e2e-logs/test-10-shell-lifecycle.md` |
| **test-11-plugin-lifecycle** | `<repo>/e2e-logs/test-11-plugin-lifecycle.md` |
| **test-12-enrollment-lifecycle** | `<repo>/e2e-logs/test-12-enrollment-lifecycle.md` |
| **three-vm-e2e** | `<repo>/e2e-logs/three-vm-e2e.md` |

ℹ️ `18:46:07` VMs kept for debugging. Delete manually with:  
ℹ️ `18:46:07`   multipass delete portlama-host portlama-agent portlama-visitor && multipass purge  
✅ `18:46:07` OVERALL: PASSED  
