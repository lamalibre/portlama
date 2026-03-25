# Portlama E2E: 02 — Tunnel Traffic (Three-VM)

> Started at `2026-03-25 18:04:28 UTC`


## Pre-flight: verify onboarding is complete


## Create tunnel via API

✅ `18:04:31` Tunnel creation returned ok: true  
✅ `18:04:31` Tunnel has an ID  
ℹ️ `18:04:31` Created tunnel ID: 8f3b93c5-62df-4f7b-b059-e84d9ca2915e (e2etraffic.test.portlama.local)  

## Configure agent VM for tunnel

✅ `18:04:31` Added tunnel.test.portlama.local to agent /etc/hosts  
✅ `18:04:31` Added e2etraffic.test.portlama.local to agent /etc/hosts  

## Start HTTP server on agent VM

✅ `18:04:33` HTTP server running on agent at port 18080  

## Refresh agent config to pick up new tunnel

ℹ️ `18:04:36` Waiting for Chisel tunnel to establish...  
✅ `18:04:36` Chisel tunnel established (port 18080 accessible on host)  

## Verify traffic through tunnel (direct, bypassing Authelia)

✅ `18:04:36` Direct tunnel traffic returns expected content  

## Reset TOTP before authentication

✅ `18:04:36` TOTP reset returned otpauth URI  
✅ `18:04:36` Extracted TOTP secret from otpauth URI  

## Authenticate with Authelia (first factor)

✅ `18:04:39` Authelia first factor authentication succeeded  

## Second factor authentication (TOTP)

ℹ️ `18:04:39` Generated TOTP code: 810509  
✅ `18:04:40` Second factor authentication succeeded (TOTP accepted)  

## Verify traffic through nginx with Authelia (full path)

✅ `18:04:40` Full-path tunnel traffic (nginx + Authelia) returns expected content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `12` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `12` |

ℹ️ `18:04:40` Cleaning up test resources...  
🔵 `18:04:45` **Running: 03-tunnel-toggle-traffic.sh**  
