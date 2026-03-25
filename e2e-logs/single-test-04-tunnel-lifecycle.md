# Portlama E2E: 04 — Tunnel Lifecycle

> Started at `2026-03-25 09:20:45 UTC`


## Pre-flight: check onboarding is complete


## Create tunnel

✅ `09:20:48` Tunnel creation returned ok: true  
✅ `09:20:48` Tunnel subdomain matches  
✅ `09:20:48` Tunnel port matches  
✅ `09:20:48` Tunnel has an ID  
✅ `09:20:48` Tunnel has an FQDN  
✅ `09:20:48` Tunnel has a createdAt timestamp  
ℹ️ `09:20:48` Created tunnel ID: f988bf83-6180-47e1-bae7-899988a61f7c  

## Verify tunnel in list

✅ `09:20:48` Tunnel appears in GET /api/tunnels  

## Verify nginx configuration

✅ `09:20:48` Nginx vhost exists at /etc/nginx/sites-enabled/portlama-app-e2etest-1774430445  
✅ `09:20:48` nginx -t passes after tunnel creation  

## Validation: reserved subdomain

✅ `09:20:48` Reserved subdomain 'panel' rejected (HTTP 400)  

## Validation: duplicate subdomain

✅ `09:20:48` Duplicate subdomain rejected (HTTP 400)  

## Validation: duplicate port

✅ `09:20:48` Duplicate port rejected (HTTP 400)  

## Validation: invalid port

✅ `09:20:48` Port below 1024 rejected (HTTP 400)  

## Mac plist endpoint

✅ `09:20:48` Mac plist endpoint returns plist content  

## Disable tunnel

✅ `09:20:50` Tunnel disable returned ok: true  
✅ `09:20:50` Tunnel shows as disabled in list  
✅ `09:20:50` Nginx sites-enabled symlink removed for disabled tunnel  
✅ `09:20:50` nginx -t passes after tunnel disable  
✅ `09:20:50` Disabled tunnel excluded from plist  

## Re-enable tunnel

✅ `09:20:52` Tunnel re-enable returned ok: true  
✅ `09:20:52` Tunnel shows as enabled in list  
✅ `09:20:52` Nginx vhost restored for re-enabled tunnel  
✅ `09:20:52` nginx -t passes after tunnel re-enable  
✅ `09:20:52` Re-enabled tunnel included in plist  

## Toggle nonexistent tunnel

✅ `09:20:52` Toggle nonexistent tunnel returns 404  

## Delete tunnel

✅ `09:20:55` Tunnel deletion returned ok: true  
✅ `09:20:55` Tunnel no longer in list after deletion  
✅ `09:20:55` Nginx vhost removed after tunnel deletion  
✅ `09:20:55` nginx -t passes after tunnel deletion  

## Delete nonexistent tunnel

✅ `09:20:55` Delete nonexistent tunnel returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `30` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `30` |

