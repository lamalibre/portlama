# Portlama E2E: 16 — Hardware-Bound Certificate Enrollment

> Started at `2026-03-29 07:35:52 UTC`


## Pre-flight: check onboarding is complete


## Admin auth mode defaults to p12

✅ `07:35:52` Admin auth mode is p12 by default  

## Create enrollment token

✅ `07:35:52` Token creation returns ok: true  
✅ `07:35:52` Token is not empty  
✅ `07:35:52` Token has expiresAt  
✅ `07:35:52` Token response contains correct label  

## Duplicate token for same label rejected

✅ `07:35:52` Duplicate token for active label returns 409  

## Public enrollment endpoint reachable without mTLS

✅ `07:35:52` Enrollment endpoint reachable without mTLS (HTTP 400)  

## Enrollment with invalid token rejected

✅ `07:35:52` Invalid token rejected with correct message  

## Enroll agent with valid token + CSR

✅ `07:35:52` Enrollment returns ok: true  
✅ `07:35:52` Enrolled label matches  
✅ `07:35:52` Enrollment returns signed certificate  
✅ `07:35:52` Enrollment returns CA certificate  
✅ `07:35:52` Enrollment returns serial number  
✅ `07:35:52` Signed cert has correct CN  

## Token replay rejected (single-use)

✅ `07:35:52` Token replay returns 401  

## Enrolled agent visible in agent list with hardware-bound method

✅ `07:35:53` Agent shows enrollmentMethod: hardware-bound  

## P12 download hidden for hardware-bound agent

✅ `07:35:53` P12 download returns 404 for hardware-bound agent (no P12 on disk)  

## Clean up: revoke test agent

✅ `07:35:53` Revoked enrollment test agent  

## Admin upgrade to hardware-bound

✅ `07:35:53` Admin upgrade returns ok: true  
✅ `07:35:53` Admin upgrade returns signed certificate  

## P12 lockdown after admin upgrade

✅ `07:35:53` P12 rotation blocked after admin upgrade (HTTP 000000)  

## Revert admin to P12 mode (for other tests)

✅ `07:35:57` Reverted admin to P12 mode with fresh cert  
✅ `07:35:57` Admin auth mode reverted to p12  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `23` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `23` |

