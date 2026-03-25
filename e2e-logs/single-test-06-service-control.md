# Portlama E2E: 06 — Service Control

> Started at `2026-03-25 09:21:02 UTC`


## Pre-flight: check onboarding is complete


## List services

✅ `09:21:02` GET /api/services returns 4 services  
✅ `09:21:02` Service 'nginx' is in the service list  
✅ `09:21:02` Service 'chisel' is in the service list  
✅ `09:21:02` Service 'authelia' is in the service list  
✅ `09:21:02` Service 'portlama-panel' is in the service list  
✅ `09:21:02` nginx status is 'active'  

## Restart nginx

✅ `09:21:07` nginx restart request accepted  
✅ `09:21:10` nginx is active after restart  

## Reload nginx

✅ `09:21:10` nginx reload returned ok: true  

## Cannot stop portlama-panel

✅ `09:21:10` Cannot stop portlama-panel (HTTP 400)  
✅ `09:21:10` Error message explains why panel cannot be stopped  

## Restart portlama-panel is allowed

✅ `09:21:10` portlama-panel restart request accepted  
✅ `09:21:13` Panel is responsive after restart  

## Invalid service name

✅ `09:21:13` Unknown service rejected (HTTP 400)  

## Invalid action

✅ `09:21:13` Invalid action 'destroy' rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

