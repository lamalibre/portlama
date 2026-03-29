# Portlama E2E: 02 — mTLS Enforcement

> Started at `2026-03-29 07:35:03 UTC`


## Request without client certificate

✅ `07:35:03` Request without cert rejected (HTTP 400)  

## Request with valid client certificate

✅ `07:35:03` Request with valid cert returns HTTP 200  
✅ `07:35:03` Health endpoint returns ok with valid cert  

## Request with invalid certificate

✅ `07:35:03` Request with untrusted cert rejected (HTTP 400)  

## Certificate validity check

✅ `07:35:03` Client certificate has valid expiry: notAfter=Mar 28 07:33:34 2028 GMT  
✅ `07:35:03` Client certificate is signed by the CA  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `6` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `6` |

