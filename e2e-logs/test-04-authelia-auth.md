# Portlama E2E: 04 — Authelia Authentication (Three-VM)

> Started at `2026-03-29 07:37:37 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `07:37:40` Tunnel creation returned ok: true  
✅ `07:37:40` Tunnel has an ID  
ℹ️ `07:37:40` Created tunnel ID: 7dd38ea8-d7f5-48a5-84e6-2b5b49af42b3  
ℹ️ `07:37:50` Waiting for Chisel tunnel to establish...  
✅ `07:37:50` Chisel tunnel established  

## Test: unauthenticated access is redirected (from visitor VM)

✅ `07:37:50` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `07:37:50` Redirect points to Authelia portal (auth.test.portlama.local)  

## Test: authenticated access succeeds (from visitor VM)

✅ `07:37:50` TOTP reset returned otpauth URI  
✅ `07:37:50` Extracted TOTP secret from otpauth URI  
✅ `07:37:53` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP) from visitor VM

ℹ️ `07:37:54` Generated TOTP code: 068333  
✅ `07:37:54` Second factor authentication succeeded (TOTP accepted)  
✅ `07:37:54` Authenticated request returns tunnel content  
✅ `07:37:54` Authenticated request returns HTTP 200  

## Test: invalid auth cookie is rejected (from visitor VM)

✅ `07:37:54` Invalid auth cookie rejected (HTTP 302)  
✅ `07:37:54` Invalid auth cookie does not return tunnel content  

## Test: Authelia portal is accessible (from visitor VM)

✅ `07:37:54` Authelia portal accessible at https://auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

ℹ️ `07:37:54` Cleaning up test resources...  
🔵 `07:38:00` **Running: 05-admin-journey.sh**  
