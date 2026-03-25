# Portlama E2E: 02 — Tunnel Traffic (Three-VM)

> Started at `2026-03-25 09:21:51 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel via API

✅ `09:21:54` Tunnel creation returned ok: true  
✅ `09:21:54` Tunnel has an ID  
ℹ️ `09:21:54` Created tunnel ID: 440f8073-ef50-417b-8a57-f0c9c84a5c32 (e2etraffic.test.portlama.local)  

## Configure agent VM for tunnel

✅ `09:21:54` Added tunnel.test.portlama.local to agent /etc/hosts  
✅ `09:21:54` Added e2etraffic.test.portlama.local to agent /etc/hosts  

## Start HTTP server on agent VM

✅ `09:21:56` HTTP server running on agent at port 18080  

## Refresh agent config to pick up new tunnel

ℹ️ `09:21:59` Waiting for Chisel tunnel to establish...  
✅ `09:21:59` Chisel tunnel established (port 18080 accessible on host)  

## Verify traffic through tunnel (direct, bypassing Authelia)

✅ `09:21:59` Direct tunnel traffic returns expected content  

## Reset TOTP before authentication

✅ `09:21:59` TOTP reset returned otpauth URI  
✅ `09:21:59` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `09:22:03` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `09:22:03` Generated TOTP code: 809190  
✅ `09:22:03` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with Authelia (full path)

✅ `09:22:03` Full-path tunnel traffic (nginx + Authelia) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `12` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `12` |

ℹ️ `09:22:03` Cleaning up test resources...  
🔵 `09:22:08` **Running: 03-tunnel-toggle-traffic.sh**  
