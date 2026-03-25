# Portlama E2E: 10 — Resilience

> Started at `2026-03-25 09:21:14 UTC`


## Pre-flight: check onboarding is complete

ℹ️ `09:21:14` Service nginx status before tests: active  
ℹ️ `09:21:14` Service chisel status before tests: active  
ℹ️ `09:21:14` Service authelia status before tests: active  
ℹ️ `09:21:14` Service portlama-panel status before tests: active  

## nginx failure and recovery

ℹ️ `09:21:14` Stopping nginx...  
✅ `09:21:16` API shows nginx as 'inactive' after stop  
✅ `09:21:16` nginx restart via API returned ok: true  
✅ `09:21:18` nginx is active after API restart  
✅ `09:21:18` API shows nginx as active after restart  

## chisel failure and recovery

ℹ️ `09:21:18` Stopping chisel...  
✅ `09:21:21` API shows chisel as 'inactive' after stop  
✅ `09:21:21` chisel restart via API returned ok: true  
✅ `09:21:23` chisel is active after API restart  

## authelia failure and recovery

ℹ️ `09:21:23` Stopping authelia...  
✅ `09:21:25` API shows authelia as 'inactive' after stop  
✅ `09:21:25` authelia restart via API returned ok: true  
✅ `09:21:27` authelia is active after API restart  

## Panel survives all service disruptions

✅ `09:21:27` Panel health is ok after all disruptions  
✅ `09:21:27` Service nginx is active at end of resilience test  
✅ `09:21:27` Service chisel is active at end of resilience test  
✅ `09:21:27` Service authelia is active at end of resilience test  
✅ `09:21:27` Service portlama-panel is active at end of resilience test  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

