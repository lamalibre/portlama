# Portlama E2E: 04 — Tunnel Lifecycle

> Started at `2026-03-25 18:02:34 UTC`


## Pre-flight: check onboarding is complete


## Create tunnel

✅ `18:02:36` Tunnel creation returned ok: true  
✅ `18:02:36` Tunnel subdomain matches  
✅ `18:02:36` Tunnel port matches  
✅ `18:02:36` Tunnel has an ID  
✅ `18:02:36` Tunnel has an FQDN  
✅ `18:02:36` Tunnel has a createdAt timestamp  
ℹ️ `18:02:36` Created tunnel ID: 54ff055e-017f-4376-97b6-f3f4666c8c2a  

## Verify tunnel in list

✅ `18:02:36` Tunnel appears in GET /api/tunnels  

## Verify nginx configuration

✅ `18:02:36` Nginx vhost exists at /etc/nginx/sites-enabled/portlama-app-e2etest-1774461754  
✅ `18:02:36` nginx -t passes after tunnel creation  

## Validation: reserved subdomain

✅ `18:02:36` Reserved subdomain 'panel' rejected (HTTP 400)  

## Validation: duplicate subdomain

✅ `18:02:36` Duplicate subdomain rejected (HTTP 400)  

## Validation: duplicate port

✅ `18:02:36` Duplicate port rejected (HTTP 400)  

## Validation: invalid port

✅ `18:02:36` Port below 1024 rejected (HTTP 400)  

## Mac plist endpoint

✅ `18:02:36` Mac plist endpoint returns plist content  

## Disable tunnel

✅ `18:02:39` Tunnel disable returned ok: true  
✅ `18:02:39` Tunnel shows as disabled in list  
✅ `18:02:39` Nginx sites-enabled symlink removed for disabled tunnel  
✅ `18:02:39` nginx -t passes after tunnel disable  
✅ `18:02:39` Disabled tunnel excluded from plist  

## Re-enable tunnel

✅ `18:02:41` Tunnel re-enable returned ok: true  
✅ `18:02:41` Tunnel shows as enabled in list  
✅ `18:02:41` Nginx vhost restored for re-enabled tunnel  
✅ `18:02:41` nginx -t passes after tunnel re-enable  
✅ `18:02:41` Re-enabled tunnel included in plist  

## Toggle nonexistent tunnel

✅ `18:02:41` Toggle nonexistent tunnel returns 404  

## Delete tunnel

✅ `18:02:43` Tunnel deletion returned ok: true  
✅ `18:02:43` Tunnel no longer in list after deletion  
✅ `18:02:43` Nginx vhost removed after tunnel deletion  
✅ `18:02:43` nginx -t passes after tunnel deletion  

## Delete nonexistent tunnel

✅ `18:02:43` Delete nonexistent tunnel returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `30` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `30` |

