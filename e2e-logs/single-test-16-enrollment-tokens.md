# Portlama E2E: 16 — Hardware-Bound Certificate Enrollment

> Started at `2026-03-25 18:03:24 UTC`


## Pre-flight: check onboarding is complete


## Admin auth mode defaults to p12

✅ `18:03:24` Admin auth mode is p12 by default  

## Create enrollment token

✅ `18:03:24` Token creation returns ok: true  
✅ `18:03:24` Token is not empty  
✅ `18:03:24` Token has expiresAt  
✅ `18:03:24` Token response contains correct label  

## Duplicate token for same label rejected

✅ `18:03:24` Duplicate token for active label returns 409  

## Public enrollment endpoint reachable without mTLS

✅ `18:03:24` Enrollment endpoint reachable without mTLS (HTTP 400)  

## Enrollment with invalid token rejected

✅ `18:03:24` Invalid token rejected with correct message  

## Enroll agent with valid token + CSR

✅ `18:03:24` Enrollment returns ok: true  
✅ `18:03:24` Enrolled label matches  
✅ `18:03:24` Enrollment returns signed certificate  
✅ `18:03:24` Enrollment returns CA certificate  
✅ `18:03:24` Enrollment returns serial number  
✅ `18:03:24` Signed cert has correct CN  

## Token replay rejected (single-use)

✅ `18:03:24` Token replay returns 401  

## Enrolled agent visible in agent list with hardware-bound method

✅ `18:03:24` Agent shows enrollmentMethod: hardware-bound  

## P12 download hidden for hardware-bound agent

✅ `18:03:24` P12 download returns 404 for hardware-bound agent (no P12 on disk)  

## Clean up: revoke test agent

✅ `18:03:24` Revoked enrollment test agent  

## Admin upgrade to hardware-bound

✅ `18:03:25` Admin upgrade returns ok: true  
✅ `18:03:25` Admin upgrade returns signed certificate  

## P12 lockdown after admin upgrade

✅ `18:03:25` P12 rotation blocked after admin upgrade (HTTP 000000)  

## Revert admin to P12 mode (for other tests)

✅ `18:03:29` Reverted admin to P12 mode with fresh cert  
✅ `18:03:29` Admin auth mode reverted to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `23` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `23` |

