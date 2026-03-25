# Portlama E2E: 12 — Enrollment Token Lifecycle (Three-VM)

> Started at `2026-03-25 09:24:48 UTC`


## Pre-flight: check onboarding is complete

✅ `09:24:48` Onboarding is complete  

## Admin auth mode defaults to p12

✅ `09:24:48` Admin auth mode is p12  

## Create enrollment token on host

✅ `09:24:48` Token created  
✅ `09:24:48` Token value present (64 chars)  

## Public enrollment reachable from agent VM without mTLS

✅ `09:24:48` Enrollment endpoint reachable from agent VM without mTLS (HTTP 401)  

## Generate CSR on agent VM and enroll

✅ `09:24:49` Agent enrolled successfully  
✅ `09:24:49` Enrolled label matches  
✅ `09:24:49` Enrollment returns serial  

## Token replay rejected

✅ `09:24:49` Token replay rejected with 401  

## Enrolled agent in registry with hardware-bound method

✅ `09:24:49` Agent shows enrollmentMethod: hardware-bound  

## Verify portlama-agent status shows enrolled agent

✅ `09:24:49` portlama-agent status shows config present  
✅ `09:24:49` systemd service portlama-chisel is enabled  
✅ `09:24:50` Agent config file exists after setup  

## Clean up: revoke test agent

✅ `09:24:50` Cleaned up test agent and temp files  

## Admin upgrade to hardware-bound

✅ `09:24:50` Admin upgrade to hardware-bound succeeded  

## P12 lockdown: rotate returns 410

✅ `09:24:50` P12 rotation blocked — old admin cert revoked during upgrade (HTTP 000000)  

## Revert admin auth mode for subsequent tests

✅ `09:24:51` Reverted adminAuthMode to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

