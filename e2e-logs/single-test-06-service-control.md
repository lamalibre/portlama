# Portlama E2E: 06 — Service Control

> Started at `2026-03-29 07:35:20 UTC`


## Pre-flight: check onboarding is complete


## List services

✅ `07:35:20` GET /api/services returns 4 services  
✅ `07:35:20` Service 'nginx' is in the service list  
✅ `07:35:20` Service 'chisel' is in the service list  
✅ `07:35:20` Service 'authelia' is in the service list  
✅ `07:35:20` Service 'portlama-panel' is in the service list  
✅ `07:35:20` nginx status is 'active'  

## Restart nginx

✅ `07:35:25` nginx restart request accepted  
✅ `07:35:28` nginx is active after restart  

## Reload nginx

✅ `07:35:28` nginx reload returned ok: true  

## Cannot stop portlama-panel

✅ `07:35:28` Cannot stop portlama-panel (HTTP 400)  
✅ `07:35:28` Error message explains why panel cannot be stopped  

## Restart portlama-panel is allowed

✅ `07:35:28` portlama-panel restart request accepted  
✅ `07:35:31` Panel is responsive after restart  

## Invalid service name

✅ `07:35:31` Unknown service rejected (HTTP 400)  

## Invalid action

✅ `07:35:31` Invalid action 'destroy' rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

