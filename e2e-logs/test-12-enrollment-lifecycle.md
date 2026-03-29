# Portlama E2E: 12 — Enrollment Token Lifecycle (Three-VM)

> Started at `2026-03-29 07:39:42 UTC`


## Pre-flight: check onboarding is complete

✅ `07:39:42` Onboarding is complete  

## Admin auth mode defaults to p12

✅ `07:39:42` Admin auth mode is p12  

## Create enrollment token on host

✅ `07:39:42` Token created  
✅ `07:39:42` Token value present (64 chars)  

## Public enrollment reachable from agent VM without mTLS

✅ `07:39:42` Enrollment endpoint reachable from agent VM without mTLS (HTTP 401)  

## Generate CSR on agent VM and enroll

✅ `07:39:43` Agent enrolled successfully  
✅ `07:39:43` Enrolled label matches  
✅ `07:39:43` Enrollment returns serial  

## Token replay rejected

✅ `07:39:43` Token replay rejected with 401  

## Enrolled agent in registry with hardware-bound method

✅ `07:39:43` Agent shows enrollmentMethod: hardware-bound  

## Verify portlama-agent status shows enrolled agent

✅ `07:39:43` portlama-agent status shows config present  
✅ `07:39:43` systemd service portlama-chisel-e2e-agent is enabled  
✅ `07:39:44` Agent config file exists after setup  

## Clean up: revoke test agent

✅ `07:39:44` Cleaned up test agent and temp files  

## Admin upgrade to hardware-bound

✅ `07:39:45` Admin upgrade to hardware-bound succeeded  

## P12 lockdown: rotate returns 410

✅ `07:39:45` P12 rotation blocked — old admin cert revoked during upgrade (HTTP 000000)  

## Revert admin auth mode for subsequent tests

✅ `07:39:46` Reverted adminAuthMode to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

🔵 `07:39:46` **Running: 13-panel-2fa.sh**  
