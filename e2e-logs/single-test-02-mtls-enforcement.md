# Portlama E2E: 02 — mTLS Enforcement

> Started at `2026-03-20 11:03:16 UTC`


## Request without client certificate

✅ `11:03:16` Request without cert rejected (HTTP 400)  

## Request with valid client certificate

✅ `11:03:16` Request with valid cert returns HTTP 200  
✅ `11:03:16` Health endpoint returns ok with valid cert  

## Request with invalid certificate

✅ `11:03:16` Request with untrusted cert rejected (HTTP 400)  

## Certificate validity check

✅ `11:03:16` Client certificate has valid expiry: notAfter=Mar 19 11:02:19 2028 GMT  
✅ `11:03:16` Client certificate is signed by the CA  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

