# Portlama E2E: 01 — Onboarding Complete Verification (Three-VM)

> Started at `2026-03-20 11:04:15 UTC`


## Onboarding status

✅ `11:04:15` Onboarding status is COMPLETED  
✅ `11:04:15` Domain is set in onboarding status: test.portlama.local  

## Core services running

✅ `11:04:15` Service nginx is active  
✅ `11:04:15` Service chisel is active  
✅ `11:04:15` Service authelia is active  
✅ `11:04:15` Service portlama-panel is active  

## Self-signed certificates exist

✅ `11:04:15` Certificate exists: /etc/portlama/pki/ca.crt  
✅ `11:04:16` Certificate exists: /etc/portlama/pki/ca.key  
✅ `11:04:16` Certificate exists: /etc/portlama/pki/client.crt  
✅ `11:04:16` Certificate exists: /etc/portlama/pki/client.key  
✅ `11:04:16` Certificate exists: /etc/portlama/pki/self-signed.pem  
✅ `11:04:16` Certificate exists: /etc/portlama/pki/self-signed-key.pem  

## Panel accessible via domain (mTLS)

✅ `11:04:16` Panel accessible via https://panel.test.portlama.local (HTTP 200)  

## DNS resolution

✅ `11:04:16` DNS resolves test.portlama.local to 192.168.2.94  

## Agent VM connectivity

✅ `11:04:16` Agent VM can reach host VM at 192.168.2.94:9292 (HTTP 400)  

## Visitor VM connectivity

✅ `11:04:17` Visitor VM can reach host VM at 192.168.2.94:9292 (HTTP 400)  
✅ `11:04:17` Visitor VM can reach Authelia at auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

🔵 `11:04:17` **Running: 02-tunnel-traffic.sh**  
