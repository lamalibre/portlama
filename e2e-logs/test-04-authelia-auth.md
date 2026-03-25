# Portlama E2E: 04 — Authelia Authentication (Three-VM)

> Started at `2026-03-25 09:22:46 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `09:22:49` Tunnel creation returned ok: true  
✅ `09:22:49` Tunnel has an ID  
ℹ️ `09:22:49` Created tunnel ID: 77906309-4b13-4238-a88c-40f460d0f1c0  
ℹ️ `09:22:59` Waiting for Chisel tunnel to establish...  
✅ `09:22:59` Chisel tunnel established  

## Test: unauthenticated access is redirected (from visitor VM)

✅ `09:22:59` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `09:22:59` Redirect points to Authelia portal (auth.test.portlama.local)  

## Test: authenticated access succeeds (from visitor VM)

✅ `09:22:59` TOTP reset returned otpauth URI  
✅ `09:22:59` Extracted TOTP secret from otpauth URI  
✅ `09:23:02` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP) from visitor VM

ℹ️ `09:23:03` Generated TOTP code: 632104  
✅ `09:23:03` Second factor authentication succeeded (TOTP accepted)  
✅ `09:23:03` Authenticated request returns tunnel content  
✅ `09:23:03` Authenticated request returns HTTP 200  

## Test: invalid auth cookie is rejected (from visitor VM)

✅ `09:23:03` Invalid auth cookie rejected (HTTP 302)  
✅ `09:23:03` Invalid auth cookie does not return tunnel content  

## Test: Authelia portal is accessible (from visitor VM)

✅ `09:23:03` Authelia portal accessible at https://auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `14` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `14` |

ℹ️ `09:23:03` Cleaning up test resources...  
🔵 `09:23:09` **Running: 05-admin-journey.sh**  
