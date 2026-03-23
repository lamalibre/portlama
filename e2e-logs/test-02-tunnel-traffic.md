# Portlama E2E: 02 — Tunnel Traffic (Three-VM)

> Started at `2026-03-23 18:42:06 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel via API

✅ `18:42:09` Tunnel creation returned ok: true  
✅ `18:42:09` Tunnel has an ID  
ℹ️ `18:42:09` Created tunnel ID: 55eb33ad-039d-4449-9843-5429619205aa (e2etraffic.test.portlama.local)  

## Configure agent VM for tunnel

✅ `18:42:09` Added tunnel.test.portlama.local to agent /etc/hosts  
✅ `18:42:09` Added e2etraffic.test.portlama.local to agent /etc/hosts  

## Start HTTP server on agent VM

✅ `18:42:12` HTTP server running on agent at port 18080  

## Start Chisel client on agent VM

ℹ️ `18:42:12` Waiting for Chisel tunnel to establish...  
✅ `18:42:12` Chisel tunnel established (port 18080 accessible on host)  

## Verify traffic through tunnel (direct, bypassing Authelia)

✅ `18:42:12` Direct tunnel traffic returns expected content  

## Reset TOTP before authentication

✅ `18:42:12` TOTP reset returned otpauth URI  
✅ `18:42:12` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `18:42:16` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `18:42:16` Generated TOTP code: 097343  
✅ `18:42:17` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with Authelia (full path)

✅ `18:42:17` Full-path tunnel traffic (nginx + Authelia) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `12` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `12` |

ℹ️ `18:42:18` Cleaning up test resources...  
🔵 `18:42:21` **Running: 03-tunnel-toggle-traffic.sh**  
