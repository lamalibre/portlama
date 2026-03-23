# Portlama E2E: 05 — Admin Journey (Three-VM)

> Started at `2026-03-23 18:43:06 UTC`


## Pre-flight: verify onboarding is complete


## 1. Panel accessible via IP:9292 (mTLS)

✅ `18:43:07` Panel via IP:9292 returns HTTP 200  
✅ `18:43:07` Panel via IP:9292 contains React mount point  
✅ `18:43:07` Panel via IP:9292 contains title tag  

## 2. Panel accessible via panel.DOMAIN (mTLS)

✅ `18:43:07` Panel via panel.test.portlama.local returns HTTP 200  
✅ `18:43:07` Panel via panel.test.portlama.local contains React mount point  
✅ `18:43:07` Panel via panel.test.portlama.local contains title tag  

## 3. Panel without mTLS cert rejected

✅ `18:43:07` Panel without mTLS cert rejected (HTTP 400)  

## 4. Dashboard API returns data

✅ `18:43:07` GET /api/health returns status: ok  
✅ `18:43:07` GET /api/system/stats has cpu field  
✅ `18:43:07` GET /api/system/stats has memory field  
✅ `18:43:07` GET /api/system/stats has disk field  

## 5. Tunnel management via panel

✅ `18:43:07` GET /api/tunnels returns tunnels array  
ℹ️ `18:43:07` Tunnels before create: 0  
✅ `18:43:10` POST /api/tunnels create returned ok: true  
✅ `18:43:10` Created tunnel has an ID  
ℹ️ `18:43:10` Created tunnel ID: f5968164-5368-48d1-9c10-18663b386642  
✅ `18:43:11` New tunnel appears in tunnel list  
✅ `18:43:13` PATCH /api/tunnels/:id disable returned ok: true  
✅ `18:43:14` Tunnel shows as disabled after PATCH  
✅ `18:43:16` PATCH /api/tunnels/:id re-enable returned ok: true  
✅ `18:43:17` Tunnel shows as enabled after re-enable PATCH  
✅ `18:43:19` DELETE /api/tunnels/:id returned ok: true  
✅ `18:43:19` Tunnel no longer appears after DELETE  

## 6. User management via panel

✅ `18:43:19` GET /api/users returns users array  
✅ `18:43:19` Users list contains at least one user (count: 2)  
✅ `18:43:22` POST /api/users create returned ok: true  
✅ `18:43:22` New user appears in users list  
✅ `18:43:24` PUT /api/users/:username update returned ok: true  
✅ `18:43:24` POST /api/users/:username/reset-totp returns otpauth URI  
✅ `18:43:24` TOTP otpauth URI has correct scheme  
✅ `18:43:27` DELETE /api/users/:username returned ok: true  
✅ `18:43:27` User no longer appears after DELETE  

## 7. Service management via panel

✅ `18:43:27` GET /api/services returns services array  
✅ `18:43:27` Service 'nginx' is listed  
✅ `18:43:27` Service 'chisel' is listed  
✅ `18:43:27` Service 'authelia' is listed  
✅ `18:43:27` Service 'portlama-panel' is listed  

## 8. Certificate management

✅ `18:43:27` GET /api/certs returns certificate info  
ℹ️ `18:43:27` Certs response keys: certs  

## 9. Cleanup

ℹ️ `18:43:27` All test sections completed. EXIT trap will handle resource cleanup.  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `36` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `36` |

ℹ️ `18:43:27` Cleaning up test resources...  
🔵 `18:43:27` **Running: 06-tunnel-user-journey.sh**  
