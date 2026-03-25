# Portlama E2E: 07 — Certificate Renewal

> Started at `2026-03-25 09:21:13 UTC`


## Pre-flight: check onboarding is complete


## List certificates

✅ `09:21:13` GET /api/certs returns 6 certificates  
✅ `09:21:13` Certificate has a type field  
✅ `09:21:13` Certificate has a domain field  
✅ `09:21:13` Certificate has an expiresAt field  
✅ `09:21:13` Certificate has numeric daysUntilExpiry: 89  

## Force renew certificate

⏭️ `09:21:13` Certificate renewal requires real Let's Encrypt — skipping  

## Renew nonexistent certificate

⏭️ `09:21:13` Certbot test requires real infrastructure — skipping  

## Auto-renew timer status

✅ `09:21:13` Certbot auto-renew timer is active  
✅ `09:21:13` Auto-renew has a next run time  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `7` |
| **Failed** | `0` |
| **Skipped** | `2` |
| **Total** | `9` |

