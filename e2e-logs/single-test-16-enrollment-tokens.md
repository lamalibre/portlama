# Portlama E2E: 16 — Hardware-Bound Certificate Enrollment

> Started at `2026-03-25 09:21:33 UTC`


## Pre-flight: check onboarding is complete


## Admin auth mode defaults to p12

✅ `09:21:33` Admin auth mode is p12 by default  

## Create enrollment token

✅ `09:21:33` Token creation returns ok: true  
✅ `09:21:33` Token is not empty  
✅ `09:21:33` Token has expiresAt  
✅ `09:21:33` Token response contains correct label  

## Duplicate token for same label rejected

✅ `09:21:33` Duplicate token for active label returns 409  

## Public enrollment endpoint reachable without mTLS

✅ `09:21:33` Enrollment endpoint reachable without mTLS (HTTP 400)  

## Enrollment with invalid token rejected

✅ `09:21:33` Invalid token rejected with correct message  

## Enroll agent with valid token + CSR

✅ `09:21:33` Enrollment returns ok: true  
✅ `09:21:33` Enrolled label matches  
✅ `09:21:33` Enrollment returns signed certificate  
✅ `09:21:33` Enrollment returns CA certificate  
✅ `09:21:33` Enrollment returns serial number  
✅ `09:21:33` Signed cert has correct CN  

## Token replay rejected (single-use)

✅ `09:21:33` Token replay returns 401  

## Enrolled agent visible in agent list with hardware-bound method

✅ `09:21:33` Agent shows enrollmentMethod: hardware-bound  

## P12 download hidden for hardware-bound agent

✅ `09:21:34` P12 download returns 404 for hardware-bound agent (no P12 on disk)  

## Clean up: revoke test agent

✅ `09:21:34` Revoked enrollment test agent  

## Admin upgrade to hardware-bound

✅ `09:21:34` Admin upgrade returns ok: true  
✅ `09:21:34` Admin upgrade returns signed certificate  

## P12 lockdown after admin upgrade

✅ `09:21:34` P12 rotation blocked after admin upgrade (HTTP 000000)  

## Revert admin to P12 mode (for other tests)

✅ `09:21:37` Reverted admin to P12 mode with fresh cert  
✅ `09:21:37` Admin auth mode reverted to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `23` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `23` |

