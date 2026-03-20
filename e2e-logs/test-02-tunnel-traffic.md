# Portlama E2E: 02 — Tunnel Traffic (Three-VM)

> Started at `2026-03-20 11:04:20 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel via API

✅ `11:04:23` Tunnel creation returned ok: true  
✅ `11:04:23` Tunnel has an ID  
ℹ️ `11:04:23` Created tunnel ID: 02238fcb-272f-45ea-9bb1-17f6223be374 (e2etraffic.test.portlama.local)  

## Configure agent VM for tunnel

✅ `11:04:23` Added tunnel.test.portlama.local to agent /etc/hosts  
✅ `11:04:23` Added e2etraffic.test.portlama.local to agent /etc/hosts  

## Start HTTP server on agent VM

✅ `11:04:25` HTTP server running on agent at port 18080  

## Start Chisel client on agent VM

ℹ️ `11:04:25` Waiting for Chisel tunnel to establish...  
✅ `11:04:25` Chisel tunnel established (port 18080 accessible on host)  

## Verify traffic through tunnel (direct, bypassing Authelia)

✅ `11:04:25` Direct tunnel traffic returns expected content  

## Reset TOTP before authentication

✅ `11:04:26` TOTP reset returned otpauth URI  
✅ `11:04:26` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `11:04:29` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `11:04:29` Generated TOTP code: 025355  
✅ `11:04:29` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with Authelia (full path)

✅ `11:04:29` Full-path tunnel traffic (nginx + Authelia) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `12` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `12` |

ℹ️ `11:04:29` Cleaning up test resources...  
🔵 `11:04:32` **Running: 03-tunnel-toggle-traffic.sh**  
