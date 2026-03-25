# Portlama E2E: 01 — Onboarding Complete Verification (Three-VM)

> Started at `2026-03-25 09:21:46 UTC`


## Onboarding status

✅ `09:21:46` Onboarding status is COMPLETED  
✅ `09:21:46` Domain is set in onboarding status: test.portlama.local  

## Core services running

✅ `09:21:47` Service nginx is active  
✅ `09:21:47` Service chisel is active  
✅ `09:21:47` Service authelia is active  
✅ `09:21:47` Service portlama-panel is active  

## Self-signed certificates exist

✅ `09:21:47` Certificate exists: /etc/portlama/pki/ca.crt  
✅ `09:21:47` Certificate exists: /etc/portlama/pki/ca.key  
✅ `09:21:47` Certificate exists: /etc/portlama/pki/client.crt  
✅ `09:21:47` Certificate exists: /etc/portlama/pki/client.key  
✅ `09:21:47` Certificate exists: /etc/portlama/pki/self-signed.pem  
✅ `09:21:47` Certificate exists: /etc/portlama/pki/self-signed-key.pem  

## Panel accessible via domain (mTLS)

✅ `09:21:47` Panel accessible via https://panel.test.portlama.local (HTTP 200)  

## DNS resolution

✅ `09:21:47` DNS resolves test.portlama.local to 192.168.2.237  

## Agent VM connectivity

✅ `09:21:48` Agent VM can reach host VM at 192.168.2.237:9292 (HTTP 400)  

## Visitor VM connectivity

✅ `09:21:48` Visitor VM can reach host VM at 192.168.2.237:9292 (HTTP 400)  
✅ `09:21:48` Visitor VM can reach Authelia at auth.test.portlama.local (HTTP 200)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `17` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `17` |

🔵 `09:21:48` **Running: 02-tunnel-traffic.sh**  
