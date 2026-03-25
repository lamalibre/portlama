# Portlama E2E: 02 — mTLS Enforcement

> Started at `2026-03-25 18:02:33 UTC`


## Request without client certificate

✅ `18:02:33` Request without cert rejected (HTTP 400)  

## Request with valid client certificate

✅ `18:02:33` Request with valid cert returns HTTP 200  
✅ `18:02:33` Health endpoint returns ok with valid cert  

## Request with invalid certificate

✅ `18:02:34` Request with untrusted cert rejected (HTTP 400)  

## Certificate validity check

✅ `18:02:34` Client certificate has valid expiry: notAfter=Mar 24 18:01:15 2028 GMT  
✅ `18:02:34` Client certificate is signed by the CA  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

