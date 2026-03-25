# Portlama E2E: 10 — Resilience

> Started at `2026-03-25 18:03:04 UTC`


## Pre-flight: check onboarding is complete

ℹ️ `18:03:05` Service nginx status before tests: active  
ℹ️ `18:03:05` Service chisel status before tests: active  
ℹ️ `18:03:05` Service authelia status before tests: active  
ℹ️ `18:03:05` Service portlama-panel status before tests: active  

## nginx failure and recovery

ℹ️ `18:03:05` Stopping nginx...  
✅ `18:03:07` API shows nginx as 'inactive' after stop  
✅ `18:03:07` nginx restart via API returned ok: true  
✅ `18:03:09` nginx is active after API restart  
✅ `18:03:09` API shows nginx as active after restart  

## chisel failure and recovery

ℹ️ `18:03:09` Stopping chisel...  
✅ `18:03:11` API shows chisel as 'inactive' after stop  
✅ `18:03:11` chisel restart via API returned ok: true  
✅ `18:03:13` chisel is active after API restart  

## authelia failure and recovery

ℹ️ `18:03:13` Stopping authelia...  
✅ `18:03:15` API shows authelia as 'inactive' after stop  
✅ `18:03:15` authelia restart via API returned ok: true  
✅ `18:03:17` authelia is active after API restart  

## Panel survives all service disruptions

✅ `18:03:17` Panel health is ok after all disruptions  
✅ `18:03:17` Service nginx is active at end of resilience test  
✅ `18:03:17` Service chisel is active at end of resilience test  
✅ `18:03:17` Service authelia is active at end of resilience test  
✅ `18:03:17` Service portlama-panel is active at end of resilience test  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

