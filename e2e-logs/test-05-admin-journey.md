# Portlama E2E: 05 — Admin Journey (Three-VM)

> Started at `2026-03-25 09:23:12 UTC`


## Pre-flight: verify onboarding is complete


## 1. Panel accessible via IP:9292 (mTLS)

✅ `09:23:12` Panel via IP:9292 returns HTTP 200  
✅ `09:23:12` Panel via IP:9292 contains React mount point  
✅ `09:23:12` Panel via IP:9292 contains title tag  

## 2. Panel accessible via panel.DOMAIN (mTLS)

✅ `09:23:12` Panel via panel.test.portlama.local returns HTTP 200  
✅ `09:23:12` Panel via panel.test.portlama.local contains React mount point  
✅ `09:23:12` Panel via panel.test.portlama.local contains title tag  

## 3. Panel without mTLS cert rejected

✅ `09:23:12` Panel without mTLS cert rejected (HTTP 400)  

## 4. Dashboard API returns data

✅ `09:23:13` GET /api/health returns status: ok  
✅ `09:23:13` GET /api/system/stats has cpu field  
✅ `09:23:13` GET /api/system/stats has memory field  
✅ `09:23:13` GET /api/system/stats has disk field  

## 5. Tunnel management via panel

✅ `09:23:13` GET /api/tunnels returns tunnels array  
ℹ️ `09:23:13` Tunnels before create: 0  
✅ `09:23:16` POST /api/tunnels create returned ok: true  
✅ `09:23:16` Created tunnel has an ID  
ℹ️ `09:23:16` Created tunnel ID: 30c1b728-0e3a-415e-a239-76d62b05b7bc  
✅ `09:23:16` New tunnel appears in tunnel list  
✅ `09:23:18` PATCH /api/tunnels/:id disable returned ok: true  
✅ `09:23:18` Tunnel shows as disabled after PATCH  
✅ `09:23:21` PATCH /api/tunnels/:id re-enable returned ok: true  
✅ `09:23:21` Tunnel shows as enabled after re-enable PATCH  
✅ `09:23:23` DELETE /api/tunnels/:id returned ok: true  
✅ `09:23:23` Tunnel no longer appears after DELETE  

## 6. User management via panel

✅ `09:23:23` GET /api/users returns users array  
✅ `09:23:23` Users list contains at least one user (count: 2)  
✅ `09:23:26` POST /api/users create returned ok: true  
✅ `09:23:26` New user appears in users list  
✅ `09:23:28` PUT /api/users/:username update returned ok: true  
✅ `09:23:28` POST /api/users/:username/reset-totp returns otpauth URI  
✅ `09:23:28` TOTP otpauth URI has correct scheme  
✅ `09:23:30` DELETE /api/users/:username returned ok: true  
✅ `09:23:30` User no longer appears after DELETE  

## 7. Service management via panel

✅ `09:23:30` GET /api/services returns services array  
✅ `09:23:30` Service 'nginx' is listed  
✅ `09:23:30` Service 'chisel' is listed  
✅ `09:23:30` Service 'authelia' is listed  
✅ `09:23:30` Service 'portlama-panel' is listed  

## 8. Certificate management

✅ `09:23:31` GET /api/certs returns certificate info  
ℹ️ `09:23:31` Certs response keys: certs  

## 9. Cleanup

ℹ️ `09:23:31` All test sections completed. EXIT trap will handle resource cleanup.  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `36` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `36` |

ℹ️ `09:23:31` Cleaning up test resources...  
🔵 `09:23:31` **Running: 06-tunnel-user-journey.sh**  
