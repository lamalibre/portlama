# Portlama E2E: 08 — mTLS Rotation

> Started at `2026-03-29 07:35:31 UTC`


## Pre-flight: check onboarding is complete


## Current cert fingerprint (before rotation)

ℹ️ `07:35:31` Current cert fingerprint: sha256 Fingerprint=EA:A2:23:C1:BB:1F:2E:6A:67:92:D0:55:4E:9B:26:8F:7D:F2:06:14:AB:BB:C3:4C:C8:E2:2D:30:82:C2:36:1C  

## Rotate mTLS certificate

✅ `07:35:32` Rotation response contains p12 password  
✅ `07:35:32` Rotation response contains expiry: 2028-03-28T07:35:32.000Z  
ℹ️ `07:35:32` Rotation warning: Your current browser certificate is now invalid. Download and import the new certificate before closing this page.  

## Download rotated certificate

✅ `07:35:32` Downloaded client.p12 (HTTP 200)  
✅ `07:35:32` Downloaded file is a valid PKCS12  
ℹ️ `07:35:32` New cert fingerprint: sha256 Fingerprint=F9:33:0C:A9:78:1E:5B:4A:1B:5E:42:7E:2B:25:0C:7C:F2:21:A6:5B:18:18:F7:85:20:D4:20:28:B5:F4:21:53  
✅ `07:35:32` New cert has different fingerprint than old cert  

## Verify API access with current credentials

✅ `07:35:32` API still accessible after rotation  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

