# Portlama E2E: 08 — mTLS Rotation

> Started at `2026-03-20 11:03:45 UTC`


## Pre-flight: check onboarding is complete


## Current cert fingerprint (before rotation)

ℹ️ `11:03:45` Current cert fingerprint: sha256 Fingerprint=13:44:A9:36:64:7F:6D:D0:64:F1:24:F2:F7:68:B1:F7:4B:5D:BC:AB:5C:38:89:36:67:9E:7A:BF:9A:A1:F6:C9  

## Rotate mTLS certificate

✅ `11:03:46` Rotation response contains p12 password  
✅ `11:03:46` Rotation response contains expiry: 2028-03-19T11:03:46.000Z  
ℹ️ `11:03:46` Rotation warning: Your current browser certificate is now invalid. Download and import the new certificate before closing this page.  

## Download rotated certificate

✅ `11:03:46` Downloaded client.p12 (HTTP 200)  
✅ `11:03:46` Downloaded file is a valid PKCS12  
ℹ️ `11:03:46` New cert fingerprint: sha256 Fingerprint=83:7F:CD:17:8C:75:9C:46:14:61:08:42:A8:F7:63:C0:AC:06:EB:E6:E6:32:36:B4:E4:04:92:61:2F:87:8E:5B  
✅ `11:03:46` New cert has different fingerprint than old cert  

## Verify API access with current credentials

✅ `11:03:46` API still accessible after rotation  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

