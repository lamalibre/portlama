# Portlama E2E: 04 — Authelia Authentication (Three-VM)

> Started at `2026-03-25 18:05:23 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `18:05:26` Tunnel creation returned ok: true  
✅ `18:05:26` Tunnel has an ID  
ℹ️ `18:05:26` Created tunnel ID: 91b97601-b325-4527-a6a9-48495eeacadc  
ℹ️ `18:05:36` Waiting for Chisel tunnel to establish...  
✅ `18:05:36` Chisel tunnel established  

## Test: unauthenticated access is redirected (from visitor VM)

✅ `18:05:36` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:05:36` Redirect points to Authelia portal (auth.test.portlama.local)  

## Test: authenticated access succeeds (from visitor VM)

✅ `18:05:36` TOTP reset returned otpauth URI  
✅ `18:05:36` Extracted TOTP secret from otpauth URI  
✅ `18:05:39` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP) from visitor VM

ℹ️ `18:05:40` Generated TOTP code: 185692  
✅ `18:05:40` Second factor authentication succeeded (TOTP accepted)  
✅ `18:05:40` Authenticated request returns tunnel content  
✅ `18:05:40` Authenticated request returns HTTP 200  

## Test: invalid auth cookie is rejected (from visitor VM)

✅ `18:05:40` Invalid auth cookie rejected (HTTP 302)  
✅ `18:05:40` Invalid auth cookie does not return tunnel content  

## Test: Authelia portal is accessible (from visitor VM)

✅ `18:05:40` Authelia portal accessible at https://auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

ℹ️ `18:05:40` Cleaning up test resources...  
🔵 `18:05:46` **Running: 05-admin-journey.sh**  
