# Portlama E2E: 05 — Admin Journey (Three-VM)

> Started at `2026-03-25 18:05:50 UTC`


## Pre-flight: verify onboarding is complete


## 1. Panel accessible via IP:9292 (mTLS)

✅ `18:05:50` Panel via IP:9292 returns HTTP 200  
✅ `18:05:50` Panel via IP:9292 contains React mount point  
✅ `18:05:50` Panel via IP:9292 contains title tag  

## 2. Panel accessible via panel.DOMAIN (mTLS)

✅ `18:05:50` Panel via panel.test.portlama.local returns HTTP 200  
✅ `18:05:50` Panel via panel.test.portlama.local contains React mount point  
✅ `18:05:50` Panel via panel.test.portlama.local contains title tag  

## 3. Panel without mTLS cert rejected

✅ `18:05:50` Panel without mTLS cert rejected (HTTP 400)  

## 4. Dashboard API returns data

✅ `18:05:50` GET /api/health returns status: ok  
✅ `18:05:50` GET /api/system/stats has cpu field  
✅ `18:05:50` GET /api/system/stats has memory field  
✅ `18:05:50` GET /api/system/stats has disk field  

## 5. Tunnel management via panel

✅ `18:05:51` GET /api/tunnels returns tunnels array  
ℹ️ `18:05:51` Tunnels before create: 0  
✅ `18:05:53` POST /api/tunnels create returned ok: true  
✅ `18:05:53` Created tunnel has an ID  
ℹ️ `18:05:53` Created tunnel ID: 2fb44d40-4058-43d0-a33d-2ea66da9a26f  
✅ `18:05:53` New tunnel appears in tunnel list  
✅ `18:05:56` PATCH /api/tunnels/:id disable returned ok: true  
✅ `18:05:56` Tunnel shows as disabled after PATCH  
✅ `18:05:58` PATCH /api/tunnels/:id re-enable returned ok: true  
✅ `18:05:58` Tunnel shows as enabled after re-enable PATCH  
✅ `18:06:01` DELETE /api/tunnels/:id returned ok: true  
✅ `18:06:01` Tunnel no longer appears after DELETE  

## 6. User management via panel

✅ `18:06:01` GET /api/users returns users array  
✅ `18:06:01` Users list contains at least one user (count: 2)  
✅ `18:06:04` POST /api/users create returned ok: true  
✅ `18:06:04` New user appears in users list  
✅ `18:06:06` PUT /api/users/:username update returned ok: true  
✅ `18:06:06` POST /api/users/:username/reset-totp returns otpauth URI  
✅ `18:06:06` TOTP otpauth URI has correct scheme  
✅ `18:06:08` DELETE /api/users/:username returned ok: true  
✅ `18:06:08` User no longer appears after DELETE  

## 7. Service management via panel

✅ `18:06:08` GET /api/services returns services array  
✅ `18:06:08` Service 'nginx' is listed  
✅ `18:06:08` Service 'chisel' is listed  
✅ `18:06:09` Service 'authelia' is listed  
✅ `18:06:09` Service 'portlama-panel' is listed  

## 8. Certificate management

✅ `18:06:09` GET /api/certs returns certificate info  
ℹ️ `18:06:09` Certs response keys: certs  

## 9. Cleanup

ℹ️ `18:06:09` All test sections completed. EXIT trap will handle resource cleanup.  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `36` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `36` |

ℹ️ `18:06:09` Cleaning up test resources...  
🔵 `18:06:09` **Running: 06-tunnel-user-journey.sh**  
