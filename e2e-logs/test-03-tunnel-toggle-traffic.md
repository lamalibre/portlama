# Portlama E2E: 03 — Tunnel Toggle Traffic (Three-VM)

> Started at `2026-03-23 18:42:24 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `18:42:27` Tunnel creation returned ok: true  
✅ `18:42:27` Tunnel has an ID  
ℹ️ `18:42:27` Created tunnel ID: b9025291-a567-4d0a-b45a-73270df8e8ed  
ℹ️ `18:42:30` Waiting for Chisel tunnel to establish...  
✅ `18:42:30` Chisel tunnel established  

## Verify traffic flows (tunnel enabled)

✅ `18:42:30` Traffic flows through enabled tunnel  

## Disable tunnel

✅ `18:42:32` Tunnel disable returned ok: true  
✅ `18:42:32` Tunnel shows as disabled in list  

## Verify traffic blocked (tunnel disabled)

✅ `18:42:34` Tunnel content not accessible after disable (vhost removed)  
✅ `18:42:34` Nginx vhost symlink removed after disable  

## Re-enable tunnel

✅ `18:42:37` Tunnel re-enable returned ok: true  
✅ `18:42:37` Tunnel shows as enabled in list  

## Verify traffic restored (tunnel re-enabled)

✅ `18:42:39` Traffic flows through re-enabled tunnel  
✅ `18:42:39` Nginx vhost restored after re-enable (HTTP 302)  

## Reset TOTP before authentication

✅ `18:42:40` TOTP reset returned otpauth URI  
✅ `18:42:40` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `18:42:43` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `18:42:43` Generated TOTP code: 328646  
✅ `18:42:43` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with full 2FA (re-enabled tunnel)

✅ `18:42:43` Full-path tunnel traffic (nginx + Authelia 2FA) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

ℹ️ `18:42:43` Cleaning up test resources...  
🔵 `18:42:46` **Running: 04-authelia-auth.sh**  
