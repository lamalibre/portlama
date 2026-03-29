# Portlama E2E: 04 — Tunnel Lifecycle

> Started at `2026-03-29 07:35:03 UTC`


## Pre-flight: check onboarding is complete


## Create tunnel

✅ `07:35:05` Tunnel creation returned ok: true  
✅ `07:35:05` Tunnel subdomain matches  
✅ `07:35:05` Tunnel port matches  
✅ `07:35:05` Tunnel has an ID  
✅ `07:35:05` Tunnel has an FQDN  
✅ `07:35:05` Tunnel has a createdAt timestamp  
ℹ️ `07:35:05` Created tunnel ID: f1be362b-1c97-4c03-b9cd-421c65668e13  

## Verify tunnel in list

✅ `07:35:05` Tunnel appears in GET /api/tunnels  

## Verify nginx configuration

✅ `07:35:05` Nginx vhost exists at /etc/nginx/sites-enabled/portlama-app-e2etest-1774769703  
✅ `07:35:05` nginx -t passes after tunnel creation  

## Validation: reserved subdomain

✅ `07:35:06` Reserved subdomain 'panel' rejected (HTTP 400)  

## Validation: duplicate subdomain

✅ `07:35:06` Duplicate subdomain rejected (HTTP 400)  

## Validation: duplicate port

✅ `07:35:06` Duplicate port rejected (HTTP 400)  

## Validation: invalid port

✅ `07:35:06` Port below 1024 rejected (HTTP 400)  

## Mac plist endpoint

✅ `07:35:06` Mac plist endpoint returns plist content  

## Disable tunnel

✅ `07:35:08` Tunnel disable returned ok: true  
✅ `07:35:08` Tunnel shows as disabled in list  
✅ `07:35:08` Nginx sites-enabled symlink removed for disabled tunnel  
✅ `07:35:08` nginx -t passes after tunnel disable  
✅ `07:35:08` Disabled tunnel excluded from plist  

## Re-enable tunnel

✅ `07:35:10` Tunnel re-enable returned ok: true  
✅ `07:35:10` Tunnel shows as enabled in list  
✅ `07:35:10` Nginx vhost restored for re-enabled tunnel  
✅ `07:35:10` nginx -t passes after tunnel re-enable  
✅ `07:35:10` Re-enabled tunnel included in plist  

## Toggle nonexistent tunnel

✅ `07:35:10` Toggle nonexistent tunnel returns 404  

## Delete tunnel

✅ `07:35:13` Tunnel deletion returned ok: true  
✅ `07:35:13` Tunnel no longer in list after deletion  
✅ `07:35:13` Nginx vhost removed after tunnel deletion  
✅ `07:35:13` nginx -t passes after tunnel deletion  

## Delete nonexistent tunnel

✅ `07:35:13` Delete nonexistent tunnel returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `30` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `30` |

