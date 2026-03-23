# Portlama E2E: 04 — Tunnel Lifecycle

> Started at `2026-03-23 18:40:52 UTC`


## Pre-flight: check onboarding is complete


## Create tunnel

✅ `18:40:55` Tunnel creation returned ok: true  
✅ `18:40:55` Tunnel subdomain matches  
✅ `18:40:55` Tunnel port matches  
✅ `18:40:55` Tunnel has an ID  
✅ `18:40:55` Tunnel has an FQDN  
✅ `18:40:55` Tunnel has a createdAt timestamp  
ℹ️ `18:40:55` Created tunnel ID: 4003ce1d-8732-4dcc-a367-1ef9b64941d6  

## Verify tunnel in list

✅ `18:40:55` Tunnel appears in GET /api/tunnels  

## Verify nginx configuration

✅ `18:40:55` Nginx vhost exists at /etc/nginx/sites-enabled/portlama-app-e2etest-1774291252  
✅ `18:40:55` nginx -t passes after tunnel creation  

## Validation: reserved subdomain

✅ `18:40:55` Reserved subdomain 'panel' rejected (HTTP 400)  

## Validation: duplicate subdomain

✅ `18:40:55` Duplicate subdomain rejected (HTTP 400)  

## Validation: duplicate port

✅ `18:40:55` Duplicate port rejected (HTTP 400)  

## Validation: invalid port

✅ `18:40:55` Port below 1024 rejected (HTTP 400)  

## Mac plist endpoint

✅ `18:40:55` Mac plist endpoint returns plist content  

## Disable tunnel

✅ `18:40:57` Tunnel disable returned ok: true  
✅ `18:40:57` Tunnel shows as disabled in list  
✅ `18:40:57` Nginx sites-enabled symlink removed for disabled tunnel  
✅ `18:40:57` nginx -t passes after tunnel disable  
✅ `18:40:57` Disabled tunnel excluded from plist  

## Re-enable tunnel

✅ `18:41:00` Tunnel re-enable returned ok: true  
✅ `18:41:00` Tunnel shows as enabled in list  
✅ `18:41:00` Nginx vhost restored for re-enabled tunnel  
✅ `18:41:00` nginx -t passes after tunnel re-enable  
✅ `18:41:00` Re-enabled tunnel included in plist  

## Toggle nonexistent tunnel

✅ `18:41:00` Toggle nonexistent tunnel returns 404  

## Delete tunnel

✅ `18:41:02` Tunnel deletion returned ok: true  
✅ `18:41:02` Tunnel no longer in list after deletion  
✅ `18:41:02` Nginx vhost removed after tunnel deletion  
✅ `18:41:02` nginx -t passes after tunnel deletion  

## Delete nonexistent tunnel

✅ `18:41:02` Delete nonexistent tunnel returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `30` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `30` |

