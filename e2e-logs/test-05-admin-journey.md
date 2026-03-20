# Portlama E2E: 05 — Admin Journey (Three-VM)

> Started at `2026-03-20 11:05:18 UTC`


## Pre-flight: verify onboarding is complete


## 1. Panel accessible via IP:9292 (mTLS)

✅ `11:05:18` Panel via IP:9292 returns HTTP 200  
✅ `11:05:18` Panel via IP:9292 contains React mount point  
✅ `11:05:18` Panel via IP:9292 contains title tag  

## 2. Panel accessible via panel.DOMAIN (mTLS)

✅ `11:05:19` Panel via panel.test.portlama.local returns HTTP 200  
✅ `11:05:19` Panel via panel.test.portlama.local contains React mount point  
✅ `11:05:19` Panel via panel.test.portlama.local contains title tag  

## 3. Panel without mTLS cert rejected

✅ `11:05:19` Panel without mTLS cert rejected (HTTP 400)  

## 4. Dashboard API returns data

✅ `11:05:19` GET /api/health returns status: ok  
✅ `11:05:19` GET /api/system/stats has cpu field  
✅ `11:05:19` GET /api/system/stats has memory field  
✅ `11:05:19` GET /api/system/stats has disk field  

## 5. Tunnel management via panel

✅ `11:05:19` GET /api/tunnels returns tunnels array  
ℹ️ `11:05:19` Tunnels before create: 0  
✅ `11:05:22` POST /api/tunnels create returned ok: true  
✅ `11:05:22` Created tunnel has an ID  
ℹ️ `11:05:22` Created tunnel ID: 7d12521b-9e5a-4233-b020-110d3bbe294a  
✅ `11:05:22` New tunnel appears in tunnel list  
✅ `11:05:25` PATCH /api/tunnels/:id disable returned ok: true  
✅ `11:05:25` Tunnel shows as disabled after PATCH  
✅ `11:05:27` PATCH /api/tunnels/:id re-enable returned ok: true  
✅ `11:05:27` Tunnel shows as enabled after re-enable PATCH  
✅ `11:05:30` DELETE /api/tunnels/:id returned ok: true  
✅ `11:05:30` Tunnel no longer appears after DELETE  

## 6. User management via panel

✅ `11:05:30` GET /api/users returns users array  
✅ `11:05:30` Users list contains at least one user (count: 2)  
✅ `11:05:33` POST /api/users create returned ok: true  
✅ `11:05:33` New user appears in users list  
✅ `11:05:35` PUT /api/users/:username update returned ok: true  
✅ `11:05:35` POST /api/users/:username/reset-totp returns otpauth URI  
✅ `11:05:35` TOTP otpauth URI has correct scheme  
✅ `11:05:37` DELETE /api/users/:username returned ok: true  
✅ `11:05:37` User no longer appears after DELETE  

## 7. Service management via panel

✅ `11:05:37` GET /api/services returns services array  
✅ `11:05:37` Service 'nginx' is listed  
✅ `11:05:37` Service 'chisel' is listed  
✅ `11:05:37` Service 'authelia' is listed  
✅ `11:05:37` Service 'portlama-panel' is listed  

## 8. Certificate management

✅ `11:05:38` GET /api/certs returns certificate info  
ℹ️ `11:05:38` Certs response keys: certs  

## 9. Cleanup

ℹ️ `11:05:38` All test sections completed. EXIT trap will handle resource cleanup.  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `36` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `36` |

ℹ️ `11:05:38` Cleaning up test resources...  
🔵 `11:05:38` **Running: 06-tunnel-user-journey.sh**  
