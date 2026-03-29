# Portlama E2E: 02 — Tunnel Traffic (Three-VM)

> Started at `2026-03-29 07:36:42 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel via API

✅ `07:36:45` Tunnel creation returned ok: true  
✅ `07:36:45` Tunnel has an ID  
ℹ️ `07:36:45` Created tunnel ID: 024228e7-d7e4-4b6a-960a-8f5b30795adf (e2etraffic.test.portlama.local)  

## Configure agent VM for tunnel

✅ `07:36:45` Added tunnel.test.portlama.local to agent /etc/hosts  
✅ `07:36:45` Added e2etraffic.test.portlama.local to agent /etc/hosts  

## Start HTTP server on agent VM

✅ `07:36:47` HTTP server running on agent at port 18080  

## Refresh agent config to pick up new tunnel

ℹ️ `07:36:50` Waiting for Chisel tunnel to establish...  
✅ `07:36:50` Chisel tunnel established (port 18080 accessible on host)  

## Verify traffic through tunnel (direct, bypassing Authelia)

✅ `07:36:50` Direct tunnel traffic returns expected content  

## Reset TOTP before authentication

✅ `07:36:50` TOTP reset returned otpauth URI  
✅ `07:36:50` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `07:36:53` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `07:36:53` Generated TOTP code: 093453  
✅ `07:36:54` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with Authelia (full path)

✅ `07:36:54` Full-path tunnel traffic (nginx + Authelia) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `12` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `12` |

ℹ️ `07:36:54` Cleaning up test resources...  
🔵 `07:36:59` **Running: 03-tunnel-toggle-traffic.sh**  
