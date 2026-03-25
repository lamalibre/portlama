# Portlama E2E: 12 — Enrollment Token Lifecycle (Three-VM)

> Started at `2026-03-25 18:07:27 UTC`


## Pre-flight: check onboarding is complete

✅ `18:07:27` Onboarding is complete  

## Admin auth mode defaults to p12

✅ `18:07:27` Admin auth mode is p12  

## Create enrollment token on host

✅ `18:07:28` Token created  
✅ `18:07:28` Token value present (64 chars)  

## Public enrollment reachable from agent VM without mTLS

✅ `18:07:28` Enrollment endpoint reachable from agent VM without mTLS (HTTP 401)  

## Generate CSR on agent VM and enroll

✅ `18:07:29` Agent enrolled successfully  
✅ `18:07:29` Enrolled label matches  
✅ `18:07:29` Enrollment returns serial  

## Token replay rejected

✅ `18:07:29` Token replay rejected with 401  

## Enrolled agent in registry with hardware-bound method

✅ `18:07:29` Agent shows enrollmentMethod: hardware-bound  

## Verify portlama-agent status shows enrolled agent

✅ `18:07:29` portlama-agent status shows config present  
✅ `18:07:29` systemd service portlama-chisel is enabled  
✅ `18:07:29` Agent config file exists after setup  

## Clean up: revoke test agent

✅ `18:07:29` Cleaned up test agent and temp files  

## Admin upgrade to hardware-bound

✅ `18:07:30` Admin upgrade to hardware-bound succeeded  

## P12 lockdown: rotate returns 410

✅ `18:07:30` P12 rotation blocked — old admin cert revoked during upgrade (HTTP 000000)  

## Revert admin auth mode for subsequent tests

✅ `18:07:31` Reverted adminAuthMode to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

🔵 `18:07:31` **Running: 13-panel-2fa.sh**  
