# Portlama E2E: 01 — Onboarding Complete Verification (Three-VM)

> Started at `2026-03-29 07:36:37 UTC`


## Onboarding status

✅ `07:36:37` Onboarding status is COMPLETED  
✅ `07:36:37` Domain is set in onboarding status: test.portlama.local  

## Core services running

✅ `07:36:37` Service nginx is active  
✅ `07:36:37` Service chisel is active  
✅ `07:36:37` Service authelia is active  
✅ `07:36:37` Service portlama-panel is active  

## Self-signed certificates exist

✅ `07:36:38` Certificate exists: /etc/portlama/pki/ca.crt  
✅ `07:36:38` Certificate exists: /etc/portlama/pki/ca.key  
✅ `07:36:38` Certificate exists: /etc/portlama/pki/client.crt  
✅ `07:36:38` Certificate exists: /etc/portlama/pki/client.key  
✅ `07:36:38` Certificate exists: /etc/portlama/pki/self-signed.pem  
✅ `07:36:38` Certificate exists: /etc/portlama/pki/self-signed-key.pem  

## Panel accessible via domain (mTLS)

✅ `07:36:38` Panel accessible via https://panel.test.portlama.local (HTTP 200)  

## DNS resolution

✅ `07:36:38` DNS resolves test.portlama.local to 192.168.2.12  

## Agent VM connectivity

✅ `07:36:38` Agent VM can reach host VM at 192.168.2.12:9292 (HTTP 400)  

## Visitor VM connectivity

✅ `07:36:39` Visitor VM can reach host VM at 192.168.2.12:9292 (HTTP 400)  
✅ `07:36:39` Visitor VM can reach Authelia at auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

🔵 `07:36:39` **Running: 02-tunnel-traffic.sh**  
