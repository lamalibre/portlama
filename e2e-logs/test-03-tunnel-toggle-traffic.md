# Portlama E2E: 03 — Tunnel Toggle Traffic (Three-VM)

> Started at `2026-03-20 11:04:35 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `11:04:38` Tunnel creation returned ok: true  
✅ `11:04:38` Tunnel has an ID  
ℹ️ `11:04:38` Created tunnel ID: 04568a2c-4ada-45e2-a487-9544f6281a76  
ℹ️ `11:04:41` Waiting for Chisel tunnel to establish...  
✅ `11:04:41` Chisel tunnel established  

## Verify traffic flows (tunnel enabled)

✅ `11:04:41` Traffic flows through enabled tunnel  

## Disable tunnel

✅ `11:04:44` Tunnel disable returned ok: true  
✅ `11:04:44` Tunnel shows as disabled in list  

## Verify traffic blocked (tunnel disabled)

✅ `11:04:46` Tunnel content not accessible after disable (vhost removed)  
✅ `11:04:46` Nginx vhost symlink removed after disable  

## Re-enable tunnel

✅ `11:04:49` Tunnel re-enable returned ok: true  
✅ `11:04:49` Tunnel shows as enabled in list  

## Verify traffic restored (tunnel re-enabled)

✅ `11:04:51` Traffic flows through re-enabled tunnel  
✅ `11:04:51` Nginx vhost restored after re-enable (HTTP 302)  

## Reset TOTP before authentication

✅ `11:04:51` TOTP reset returned otpauth URI  
✅ `11:04:51` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `11:04:55` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `11:04:55` Generated TOTP code: 533164  
✅ `11:04:55` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with full 2FA (re-enabled tunnel)

✅ `11:04:55` Full-path tunnel traffic (nginx + Authelia 2FA) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

ℹ️ `11:04:55` Cleaning up test resources...  
🔵 `11:04:58` **Running: 04-authelia-auth.sh**  
