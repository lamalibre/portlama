# Portlama E2E: 16 — Hardware-Bound Certificate Enrollment

> Started at `2026-03-23 18:41:46 UTC`


## Pre-flight: check onboarding is complete


## Admin auth mode defaults to p12

✅ `18:41:46` Admin auth mode is p12 by default  

## Create enrollment token

✅ `18:41:46` Token creation returns ok: true  
✅ `18:41:46` Token is not empty  
✅ `18:41:46` Token has expiresAt  
✅ `18:41:46` Token response contains correct label  

## Duplicate token for same label rejected

✅ `18:41:46` Duplicate token for active label returns 409  

## Public enrollment endpoint reachable without mTLS

✅ `18:41:46` Enrollment endpoint reachable without mTLS (HTTP 400)  

## Enrollment with invalid token rejected

✅ `18:41:46` Invalid token rejected with correct message  

## Enroll agent with valid token + CSR

✅ `18:41:46` Enrollment returns ok: true  
✅ `18:41:46` Enrolled label matches  
✅ `18:41:46` Enrollment returns signed certificate  
✅ `18:41:46` Enrollment returns CA certificate  
✅ `18:41:46` Enrollment returns serial number  
✅ `18:41:46` Signed cert has correct CN  

## Token replay rejected (single-use)

✅ `18:41:46` Token replay returns 401  

## Enrolled agent visible in agent list with hardware-bound method

✅ `18:41:46` Agent shows enrollmentMethod: hardware-bound  

## P12 download hidden for hardware-bound agent

✅ `18:41:46` P12 download returns 404 for hardware-bound agent (no P12 on disk)  

## Clean up: revoke test agent

✅ `18:41:46` Revoked enrollment test agent  

## Admin upgrade to hardware-bound

✅ `18:41:47` Admin upgrade returns ok: true  
✅ `18:41:47` Admin upgrade returns signed certificate  

## P12 lockdown after admin upgrade

✅ `18:41:47` P12 rotation blocked after admin upgrade (HTTP 000000)  

## Revert admin to P12 mode (for other tests)

✅ `18:41:51` Reverted admin to P12 mode with fresh cert  
✅ `18:41:51` Admin auth mode reverted to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `23` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `23` |

