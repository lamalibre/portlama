# Portlama E2E: 12 — Enrollment Token Lifecycle (Three-VM)

> Started at `2026-03-23 18:46:03 UTC`


## Pre-flight: check onboarding is complete

✅ `18:46:04` Onboarding is complete  

## Admin auth mode defaults to p12

✅ `18:46:04` Admin auth mode is p12  

## Create enrollment token on host

✅ `18:46:04` Token created  
✅ `18:46:04` Token value present (64 chars)  

## Public enrollment reachable from agent VM without mTLS

✅ `18:46:04` Enrollment endpoint reachable from agent VM without mTLS (HTTP 401)  

## Generate CSR on agent VM and enroll

✅ `18:46:04` Agent enrolled successfully  
✅ `18:46:04` Enrolled label matches  
✅ `18:46:04` Enrollment returns serial  

## Token replay rejected

✅ `18:46:05` Token replay rejected with 401  

## Enrolled agent in registry with hardware-bound method

✅ `18:46:05` Agent shows enrollmentMethod: hardware-bound  

## Clean up: revoke test agent

✅ `18:46:05` Cleaned up test agent and temp files  

## Admin upgrade to hardware-bound

✅ `18:46:05` Admin upgrade to hardware-bound succeeded  

## P12 lockdown: rotate returns 410

✅ `18:46:06` P12 rotation blocked — old admin cert revoked during upgrade (HTTP 000000)  

## Revert admin auth mode for subsequent tests

✅ `18:46:07` Reverted adminAuthMode to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

