# Portlama E2E: 05 — Admin Journey (Three-VM)

> Started at `2026-03-29 07:38:03 UTC`


## Pre-flight: verify onboarding is complete


## 1. Panel accessible via IP:9292 (mTLS)

✅ `07:38:03` Panel via IP:9292 returns HTTP 200  
✅ `07:38:03` Panel via IP:9292 contains React mount point  
✅ `07:38:03` Panel via IP:9292 contains title tag  

## 2. Panel accessible via panel.DOMAIN (mTLS)

✅ `07:38:03` Panel via panel.test.portlama.local returns HTTP 200  
✅ `07:38:03` Panel via panel.test.portlama.local contains React mount point  
✅ `07:38:03` Panel via panel.test.portlama.local contains title tag  

## 3. Panel without mTLS cert rejected

✅ `07:38:04` Panel without mTLS cert rejected (HTTP 400)  

## 4. Dashboard API returns data

✅ `07:38:04` GET /api/health returns status: ok  
✅ `07:38:04` GET /api/system/stats has cpu field  
✅ `07:38:04` GET /api/system/stats has memory field  
✅ `07:38:04` GET /api/system/stats has disk field  

## 5. Tunnel management via panel

✅ `07:38:04` GET /api/tunnels returns tunnels array  
ℹ️ `07:38:04` Tunnels before create: 0  
✅ `07:38:07` POST /api/tunnels create returned ok: true  
✅ `07:38:07` Created tunnel has an ID  
ℹ️ `07:38:07` Created tunnel ID: 960179d2-2e64-45a4-94e0-826eca3f767e  
✅ `07:38:07` New tunnel appears in tunnel list  
✅ `07:38:09` PATCH /api/tunnels/:id disable returned ok: true  
✅ `07:38:09` Tunnel shows as disabled after PATCH  
✅ `07:38:12` PATCH /api/tunnels/:id re-enable returned ok: true  
✅ `07:38:12` Tunnel shows as enabled after re-enable PATCH  
✅ `07:38:14` DELETE /api/tunnels/:id returned ok: true  
✅ `07:38:14` Tunnel no longer appears after DELETE  

## 6. User management via panel

✅ `07:38:14` GET /api/users returns users array  
✅ `07:38:14` Users list contains at least one user (count: 2)  
✅ `07:38:17` POST /api/users create returned ok: true  
✅ `07:38:17` New user appears in users list  
✅ `07:38:19` PUT /api/users/:username update returned ok: true  
✅ `07:38:20` POST /api/users/:username/reset-totp returns otpauth URI  
✅ `07:38:20` TOTP otpauth URI has correct scheme  
✅ `07:38:22` DELETE /api/users/:username returned ok: true  
✅ `07:38:22` User no longer appears after DELETE  

## 7. Service management via panel

✅ `07:38:22` GET /api/services returns services array  
✅ `07:38:22` Service 'nginx' is listed  
✅ `07:38:22` Service 'chisel' is listed  
✅ `07:38:22` Service 'authelia' is listed  
✅ `07:38:22` Service 'portlama-panel' is listed  

## 8. Certificate management

✅ `07:38:22` GET /api/certs returns certificate info  
ℹ️ `07:38:22` Certs response keys: certs  

## 9. Cleanup

ℹ️ `07:38:22` All test sections completed. EXIT trap will handle resource cleanup.  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `36` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `36` |

ℹ️ `07:38:22` Cleaning up test resources...  
🔵 `07:38:23` **Running: 06-tunnel-user-journey.sh**  
