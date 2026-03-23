# Portlama E2E: 06 — Service Control

> Started at `2026-03-23 18:41:10 UTC`


## Pre-flight: check onboarding is complete


## List services

✅ `18:41:10` GET /api/services returns 4 services  
✅ `18:41:10` Service 'nginx' is in the service list  
✅ `18:41:10` Service 'chisel' is in the service list  
✅ `18:41:10` Service 'authelia' is in the service list  
✅ `18:41:10` Service 'portlama-panel' is in the service list  
✅ `18:41:10` nginx status is 'active'  

## Restart nginx

✅ `18:41:15` nginx restart request accepted  
✅ `18:41:18` nginx is active after restart  

## Reload nginx

✅ `18:41:18` nginx reload returned ok: true  

## Cannot stop portlama-panel

✅ `18:41:18` Cannot stop portlama-panel (HTTP 400)  
✅ `18:41:18` Error message explains why panel cannot be stopped  

## Restart portlama-panel is allowed

✅ `18:41:18` portlama-panel restart request accepted  
✅ `18:41:21` Panel is responsive after restart  

## Invalid service name

✅ `18:41:21` Unknown service rejected (HTTP 400)  

## Invalid action

✅ `18:41:22` Invalid action 'destroy' rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

