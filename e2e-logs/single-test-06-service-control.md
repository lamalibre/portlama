# Portlama E2E: 06 — Service Control

> Started at `2026-03-20 11:03:33 UTC`


## Pre-flight: check onboarding is complete


## List services

✅ `11:03:33` GET /api/services returns 4 services  
✅ `11:03:33` Service 'nginx' is in the service list  
✅ `11:03:33` Service 'chisel' is in the service list  
✅ `11:03:33` Service 'authelia' is in the service list  
✅ `11:03:33` Service 'portlama-panel' is in the service list  
✅ `11:03:33` nginx status is 'active'  

## Restart nginx

✅ `11:03:38` nginx restart request accepted  
✅ `11:03:41` nginx is active after restart  

## Reload nginx

✅ `11:03:41` nginx reload returned ok: true  

## Cannot stop portlama-panel

✅ `11:03:41` Cannot stop portlama-panel (HTTP 400)  
✅ `11:03:41` Error message explains why panel cannot be stopped  

## Restart portlama-panel is allowed

✅ `11:03:41` portlama-panel restart request accepted  
✅ `11:03:44` Panel is responsive after restart  

## Invalid service name

✅ `11:03:44` Unknown service rejected (HTTP 400)  

## Invalid action

✅ `11:03:44` Invalid action 'destroy' rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

