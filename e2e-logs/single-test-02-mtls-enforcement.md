# Portlama E2E: 02 — mTLS Enforcement

> Started at `2026-03-23 18:40:52 UTC`


## Request without client certificate

✅ `18:40:52` Request without cert rejected (HTTP 400)  

## Request with valid client certificate

✅ `18:40:52` Request with valid cert returns HTTP 200  
✅ `18:40:52` Health endpoint returns ok with valid cert  

## Request with invalid certificate

✅ `18:40:52` Request with untrusted cert rejected (HTTP 400)  

## Certificate validity check

✅ `18:40:52` Client certificate has valid expiry: notAfter=Mar 22 18:38:00 2028 GMT  
✅ `18:40:52` Client certificate is signed by the CA  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

