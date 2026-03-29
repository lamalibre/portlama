# Portlama E2E: 07 — Certificate Renewal

> Started at `2026-03-29 07:35:31 UTC`


## Pre-flight: check onboarding is complete


## List certificates

✅ `07:35:31` GET /api/certs returns 6 certificates  
✅ `07:35:31` Certificate has a type field  
✅ `07:35:31` Certificate has a domain field  
✅ `07:35:31` Certificate has an expiresAt field  
✅ `07:35:31` Certificate has numeric daysUntilExpiry: 89  

## Force renew certificate

⏭️ `07:35:31` Certificate renewal requires real Let's Encrypt — skipping  

## Renew nonexistent certificate

⏭️ `07:35:31` Certbot test requires real infrastructure — skipping  

## Auto-renew timer status

✅ `07:35:31` Certbot auto-renew timer is active  
✅ `07:35:31` Auto-renew has a next run time  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `7` |
| **Failed** | `0` |
| **Skipped** | `2` |
| **Total** | `9` |

