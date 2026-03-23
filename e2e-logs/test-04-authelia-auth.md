# Portlama E2E: 04 — Authelia Authentication (Three-VM)

> Started at `2026-03-23 18:42:49 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `18:42:52` Tunnel creation returned ok: true  
✅ `18:42:52` Tunnel has an ID  
ℹ️ `18:42:52` Created tunnel ID: 612fa5e1-307a-4649-85ea-2abf07e36429  
ℹ️ `18:42:55` Waiting for Chisel tunnel to establish...  
✅ `18:42:55` Chisel tunnel established  

## Test: unauthenticated access is redirected (from visitor VM)

✅ `18:42:55` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:42:56` Redirect points to Authelia portal (auth.test.portlama.local)  

## Test: authenticated access succeeds (from visitor VM)

✅ `18:42:56` TOTP reset returned otpauth URI  
✅ `18:42:56` Extracted TOTP secret from otpauth URI  
✅ `18:42:59` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP) from visitor VM

ℹ️ `18:42:59` Generated TOTP code: 900100  
✅ `18:42:59` Second factor authentication succeeded (TOTP accepted)  
✅ `18:42:59` Authenticated request returns tunnel content  
✅ `18:43:00` Authenticated request returns HTTP 200  

## Test: invalid auth cookie is rejected (from visitor VM)

✅ `18:43:00` Invalid auth cookie rejected (HTTP 302)  
✅ `18:43:00` Invalid auth cookie does not return tunnel content  

## Test: Authelia portal is accessible (from visitor VM)

✅ `18:43:00` Authelia portal accessible at https://auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

ℹ️ `18:43:00` Cleaning up test resources...  
🔵 `18:43:03` **Running: 05-admin-journey.sh**  
