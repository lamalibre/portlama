# Portlama E2E: 03 — Tunnel Toggle Traffic (Three-VM)

> Started at `2026-03-29 07:37:02 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel and establish connection

✅ `07:37:05` Tunnel creation returned ok: true  
✅ `07:37:05` Tunnel has an ID  
ℹ️ `07:37:05` Created tunnel ID: 4406a4d0-aa07-49bc-a0ba-0227c6aea328  
ℹ️ `07:37:15` Waiting for Chisel tunnel to establish...  
✅ `07:37:15` Chisel tunnel established  

## Verify traffic flows (tunnel enabled)

✅ `07:37:15` Traffic flows through enabled tunnel  

## Disable tunnel

✅ `07:37:17` Tunnel disable returned ok: true  
✅ `07:37:17` Tunnel shows as disabled in list  

## Verify traffic blocked (tunnel disabled)

✅ `07:37:20` Tunnel content not accessible after disable (vhost removed)  
✅ `07:37:20` Nginx vhost symlink removed after disable  

## Re-enable tunnel

✅ `07:37:22` Tunnel re-enable returned ok: true  
✅ `07:37:22` Tunnel shows as enabled in list  

## Verify traffic restored (tunnel re-enabled)

✅ `07:37:24` Traffic flows through re-enabled tunnel  
✅ `07:37:24` Nginx vhost restored after re-enable (HTTP 302)  

## Reset TOTP before authentication

✅ `07:37:25` TOTP reset returned otpauth URI  
✅ `07:37:25` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `07:37:28` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `07:37:28` Generated TOTP code: 628741  
✅ `07:37:28` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with full 2FA (re-enabled tunnel)

✅ `07:37:28` Full-path tunnel traffic (nginx + Authelia 2FA) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

ℹ️ `07:37:28` Cleaning up test resources...  
🔵 `07:37:34` **Running: 04-authelia-auth.sh**  
