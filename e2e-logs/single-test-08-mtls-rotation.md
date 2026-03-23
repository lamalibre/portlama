# Portlama E2E: 08 — mTLS Rotation

> Started at `2026-03-23 18:41:23 UTC`


## Pre-flight: check onboarding is complete


## Current cert fingerprint (before rotation)

ℹ️ `18:41:23` Current cert fingerprint: sha256 Fingerprint=DF:B1:C7:9D:3B:05:31:CA:42:D1:A2:0F:FB:55:C8:48:EC:7E:2B:4D:08:DB:B7:38:BF:2C:FB:DA:19:DF:79:66  

## Rotate mTLS certificate

✅ `18:41:24` Rotation response contains p12 password  
✅ `18:41:24` Rotation response contains expiry: 2028-03-22T18:41:24.000Z  
ℹ️ `18:41:24` Rotation warning: Your current browser certificate is now invalid. Download and import the new certificate before closing this page.  

## Download rotated certificate

✅ `18:41:24` Downloaded client.p12 (HTTP 200)  
✅ `18:41:24` Downloaded file is a valid PKCS12  
ℹ️ `18:41:24` New cert fingerprint: sha256 Fingerprint=9F:58:F5:61:AF:E7:E4:CF:51:98:ED:1C:05:04:BB:61:07:25:4A:AE:E5:52:F3:CD:04:36:5F:94:A5:23:8D:57  
✅ `18:41:24` New cert has different fingerprint than old cert  

## Verify API access with current credentials

✅ `18:41:25` API still accessible after rotation  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

