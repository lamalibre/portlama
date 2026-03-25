# Portlama E2E: 08 — mTLS Rotation

> Started at `2026-03-25 09:21:13 UTC`


## Pre-flight: check onboarding is complete


## Current cert fingerprint (before rotation)

ℹ️ `09:21:13` Current cert fingerprint: sha256 Fingerprint=CF:46:1F:18:33:9D:EE:FC:12:37:06:21:42:60:6E:4A:2A:5D:6C:54:51:98:25:4E:98:83:4C:2D:A9:C3:BE:1D  

## Rotate mTLS certificate

✅ `09:21:14` Rotation response contains p12 password  
✅ `09:21:14` Rotation response contains expiry: 2028-03-24T09:21:14.000Z  
ℹ️ `09:21:14` Rotation warning: Your current browser certificate is now invalid. Download and import the new certificate before closing this page.  

## Download rotated certificate

✅ `09:21:14` Downloaded client.p12 (HTTP 200)  
✅ `09:21:14` Downloaded file is a valid PKCS12  
ℹ️ `09:21:14` New cert fingerprint: sha256 Fingerprint=75:8A:60:FD:9B:A8:DF:74:61:B9:73:08:E8:47:70:9A:28:A2:7D:F5:91:DE:A1:A3:76:AE:2B:6B:0F:75:96:92  
✅ `09:21:14` New cert has different fingerprint than old cert  

## Verify API access with current credentials

✅ `09:21:14` API still accessible after rotation  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

