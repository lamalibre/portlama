# Portlama E2E: 04 — Tunnel Lifecycle

> Started at `2026-03-20 11:03:16 UTC`


## Pre-flight: check onboarding is complete


## Create tunnel

✅ `11:03:19` Tunnel creation returned ok: true  
✅ `11:03:19` Tunnel subdomain matches  
✅ `11:03:19` Tunnel port matches  
✅ `11:03:19` Tunnel has an ID  
✅ `11:03:19` Tunnel has an FQDN  
✅ `11:03:19` Tunnel has a createdAt timestamp  
ℹ️ `11:03:19` Created tunnel ID: a9890662-1e9d-495c-9854-f83fd4da2239  

## Verify tunnel in list

✅ `11:03:19` Tunnel appears in GET /api/tunnels  

## Verify nginx configuration

✅ `11:03:19` Nginx vhost exists at /etc/nginx/sites-enabled/portlama-app-e2etest-1774004596  
✅ `11:03:19` nginx -t passes after tunnel creation  

## Validation: reserved subdomain

✅ `11:03:19` Reserved subdomain 'panel' rejected (HTTP 400)  

## Validation: duplicate subdomain

✅ `11:03:19` Duplicate subdomain rejected (HTTP 400)  

## Validation: duplicate port

✅ `11:03:19` Duplicate port rejected (HTTP 400)  

## Validation: invalid port

✅ `11:03:19` Port below 1024 rejected (HTTP 400)  

## Mac plist endpoint

✅ `11:03:19` Mac plist endpoint returns plist content  

## Disable tunnel

✅ `11:03:21` Tunnel disable returned ok: true  
✅ `11:03:21` Tunnel shows as disabled in list  
✅ `11:03:21` Nginx sites-enabled symlink removed for disabled tunnel  
✅ `11:03:21` nginx -t passes after tunnel disable  
✅ `11:03:21` Disabled tunnel excluded from plist  

## Re-enable tunnel

✅ `11:03:24` Tunnel re-enable returned ok: true  
✅ `11:03:24` Tunnel shows as enabled in list  
✅ `11:03:24` Nginx vhost restored for re-enabled tunnel  
✅ `11:03:24` nginx -t passes after tunnel re-enable  
✅ `11:03:24` Re-enabled tunnel included in plist  

## Toggle nonexistent tunnel

✅ `11:03:24` Toggle nonexistent tunnel returns 404  

## Delete tunnel

✅ `11:03:26` Tunnel deletion returned ok: true  
✅ `11:03:26` Tunnel no longer in list after deletion  
✅ `11:03:26` Nginx vhost removed after tunnel deletion  
✅ `11:03:26` nginx -t passes after tunnel deletion  

## Delete nonexistent tunnel

✅ `11:03:26` Delete nonexistent tunnel returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `30` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `30` |

