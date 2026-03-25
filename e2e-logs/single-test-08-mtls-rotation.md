# Portlama E2E: 08 — mTLS Rotation

> Started at `2026-03-25 18:03:02 UTC`


## Pre-flight: check onboarding is complete


## Current cert fingerprint (before rotation)

ℹ️ `18:03:02` Current cert fingerprint: sha256 Fingerprint=D3:04:73:AB:E6:13:51:83:8D:BD:DE:69:75:AB:BA:22:8E:73:0E:C9:72:C4:F6:C9:9D:94:9B:88:8B:F1:60:E7  

## Rotate mTLS certificate

✅ `18:03:04` Rotation response contains p12 password  
✅ `18:03:04` Rotation response contains expiry: 2028-03-24T18:03:04.000Z  
ℹ️ `18:03:04` Rotation warning: Your current browser certificate is now invalid. Download and import the new certificate before closing this page.  

## Download rotated certificate

✅ `18:03:04` Downloaded client.p12 (HTTP 200)  
✅ `18:03:04` Downloaded file is a valid PKCS12  
ℹ️ `18:03:04` New cert fingerprint: sha256 Fingerprint=0A:9A:6E:F4:97:81:34:84:1D:3A:C0:C3:75:96:3F:4C:CF:2A:FB:83:66:1B:D2:73:6B:34:BE:FD:09:FF:F9:41  
✅ `18:03:04` New cert has different fingerprint than old cert  

## Verify API access with current credentials

✅ `18:03:04` API still accessible after rotation  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

