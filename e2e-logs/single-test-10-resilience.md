# Portlama E2E: 10 — Resilience

> Started at `2026-03-20 11:03:46 UTC`


## Pre-flight: check onboarding is complete

ℹ️ `11:03:46` Service nginx status before tests: active  
ℹ️ `11:03:46` Service chisel status before tests: active  
ℹ️ `11:03:46` Service authelia status before tests: active  
ℹ️ `11:03:46` Service portlama-panel status before tests: active  

## nginx failure and recovery

ℹ️ `11:03:46` Stopping nginx...  
✅ `11:03:48` API shows nginx as 'inactive' after stop  
✅ `11:03:49` nginx restart via API returned ok: true  
✅ `11:03:51` nginx is active after API restart  
✅ `11:03:51` API shows nginx as active after restart  

## chisel failure and recovery

ℹ️ `11:03:51` Stopping chisel...  
✅ `11:03:53` API shows chisel as 'inactive' after stop  
✅ `11:03:53` chisel restart via API returned ok: true  
✅ `11:03:55` chisel is active after API restart  

## authelia failure and recovery

ℹ️ `11:03:55` Stopping authelia...  
✅ `11:03:57` API shows authelia as 'inactive' after stop  
✅ `11:03:57` authelia restart via API returned ok: true  
✅ `11:03:59` authelia is active after API restart  

## Panel survives all service disruptions

✅ `11:03:59` Panel health is ok after all disruptions  
✅ `11:03:59` Service nginx is active at end of resilience test  
✅ `11:03:59` Service chisel is active at end of resilience test  
✅ `11:03:59` Service authelia is active at end of resilience test  
✅ `11:03:59` Service portlama-panel is active at end of resilience test  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

