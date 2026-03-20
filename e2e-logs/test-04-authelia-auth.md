# Portlama E2E: 04 — Authelia Authentication (Three-VM)

> Started at `2026-03-20 11:05:01 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `11:05:04` Tunnel creation returned ok: true  
✅ `11:05:04` Tunnel has an ID  
ℹ️ `11:05:04` Created tunnel ID: a411cb9d-1797-4af9-b95e-4d7de5fca2ce  
ℹ️ `11:05:07` Waiting for Chisel tunnel to establish...  
✅ `11:05:07` Chisel tunnel established  

## Test: unauthenticated access is redirected (from visitor VM)

✅ `11:05:07` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `11:05:07` Redirect points to Authelia portal (auth.test.portlama.local)  

## Test: authenticated access succeeds (from visitor VM)

✅ `11:05:08` TOTP reset returned otpauth URI  
✅ `11:05:08` Extracted TOTP secret from otpauth URI  
✅ `11:05:11` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP) from visitor VM

ℹ️ `11:05:11` Generated TOTP code: 480836  
✅ `11:05:11` Second factor authentication succeeded (TOTP accepted)  
✅ `11:05:11` Authenticated request returns tunnel content  
✅ `11:05:11` Authenticated request returns HTTP 200  

## Test: invalid auth cookie is rejected (from visitor VM)

✅ `11:05:12` Invalid auth cookie rejected (HTTP 302)  
✅ `11:05:12` Invalid auth cookie does not return tunnel content  

## Test: Authelia portal is accessible (from visitor VM)

✅ `11:05:12` Authelia portal accessible at https://auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

ℹ️ `11:05:12` Cleaning up test resources...  
🔵 `11:05:15` **Running: 05-admin-journey.sh**  
