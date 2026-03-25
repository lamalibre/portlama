# Portlama E2E: 03 — Tunnel Toggle Traffic (Three-VM)

> Started at `2026-03-25 18:04:49 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `18:04:52` Tunnel creation returned ok: true  
✅ `18:04:52` Tunnel has an ID  
ℹ️ `18:04:52` Created tunnel ID: 138256f8-e849-4e2d-b1d5-34a8a7ba82fc  
ℹ️ `18:05:01` Waiting for Chisel tunnel to establish...  
✅ `18:05:01` Chisel tunnel established  

## Verify traffic flows (tunnel enabled)

✅ `18:05:01` Traffic flows through enabled tunnel  

## Disable tunnel

✅ `18:05:03` Tunnel disable returned ok: true  
✅ `18:05:04` Tunnel shows as disabled in list  

## Verify traffic blocked (tunnel disabled)

✅ `18:05:06` Tunnel content not accessible after disable (vhost removed)  
✅ `18:05:06` Nginx vhost symlink removed after disable  

## Re-enable tunnel

✅ `18:05:08` Tunnel re-enable returned ok: true  
✅ `18:05:08` Tunnel shows as enabled in list  

## Verify traffic restored (tunnel re-enabled)

✅ `18:05:10` Traffic flows through re-enabled tunnel  
✅ `18:05:11` Nginx vhost restored after re-enable (HTTP 302)  

## Reset TOTP before authentication

✅ `18:05:11` TOTP reset returned otpauth URI  
✅ `18:05:11` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `18:05:14` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `18:05:14` Generated TOTP code: 264833  
✅ `18:05:14` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with full 2FA (re-enabled tunnel)

✅ `18:05:14` Full-path tunnel traffic (nginx + Authelia 2FA) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

ℹ️ `18:05:14` Cleaning up test resources...  
🔵 `18:05:20` **Running: 04-authelia-auth.sh**  
