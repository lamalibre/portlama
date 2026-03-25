# Portlama E2E: 03 — Tunnel Toggle Traffic (Three-VM)

> Started at `2026-03-25 09:22:12 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `09:22:14` Tunnel creation returned ok: true  
✅ `09:22:14` Tunnel has an ID  
ℹ️ `09:22:14` Created tunnel ID: fe31a223-46f7-401d-9522-ec7f8f3ae6d7  
ℹ️ `09:22:24` Waiting for Chisel tunnel to establish...  
✅ `09:22:24` Chisel tunnel established  

## Verify traffic flows (tunnel enabled)

✅ `09:22:24` Traffic flows through enabled tunnel  

## Disable tunnel

✅ `09:22:27` Tunnel disable returned ok: true  
✅ `09:22:27` Tunnel shows as disabled in list  

## Verify traffic blocked (tunnel disabled)

✅ `09:22:29` Tunnel content not accessible after disable (vhost removed)  
✅ `09:22:29` Nginx vhost symlink removed after disable  

## Re-enable tunnel

✅ `09:22:31` Tunnel re-enable returned ok: true  
✅ `09:22:31` Tunnel shows as enabled in list  

## Verify traffic restored (tunnel re-enabled)

✅ `09:22:34` Traffic flows through re-enabled tunnel  
✅ `09:22:34` Nginx vhost restored after re-enable (HTTP 302)  

## Reset TOTP before authentication

✅ `09:22:34` TOTP reset returned otpauth URI  
✅ `09:22:34` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `09:22:37` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `09:22:37` Generated TOTP code: 348719  
✅ `09:22:37` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with full 2FA (re-enabled tunnel)

✅ `09:22:37` Full-path tunnel traffic (nginx + Authelia 2FA) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

ℹ️ `09:22:37` Cleaning up test resources...  
🔵 `09:22:43` **Running: 04-authelia-auth.sh**  
