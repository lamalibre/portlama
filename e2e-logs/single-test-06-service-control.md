# Portlama E2E: 06 — Service Control

> Started at `2026-03-25 18:02:50 UTC`


## Pre-flight: check onboarding is complete


## List services

✅ `18:02:50` GET /api/services returns 4 services  
✅ `18:02:50` Service 'nginx' is in the service list  
✅ `18:02:50` Service 'chisel' is in the service list  
✅ `18:02:50` Service 'authelia' is in the service list  
✅ `18:02:50` Service 'portlama-panel' is in the service list  
✅ `18:02:50` nginx status is 'active'  

## Restart nginx

✅ `18:02:55` nginx restart request accepted  
✅ `18:02:59` nginx is active after restart  

## Reload nginx

✅ `18:02:59` nginx reload returned ok: true  

## Cannot stop portlama-panel

✅ `18:02:59` Cannot stop portlama-panel (HTTP 400)  
✅ `18:02:59` Error message explains why panel cannot be stopped  

## Restart portlama-panel is allowed

✅ `18:02:59` portlama-panel restart request accepted  
✅ `18:03:02` Panel is responsive after restart  

## Invalid service name

✅ `18:03:02` Unknown service rejected (HTTP 400)  

## Invalid action

✅ `18:03:02` Invalid action 'destroy' rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

