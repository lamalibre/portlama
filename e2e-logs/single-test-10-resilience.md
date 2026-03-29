# Portlama E2E: 10 — Resilience

> Started at `2026-03-29 07:35:33 UTC`


## Pre-flight: check onboarding is complete

ℹ️ `07:35:33` Service nginx status before tests: active  
ℹ️ `07:35:33` Service chisel status before tests: active  
ℹ️ `07:35:33` Service authelia status before tests: active  
ℹ️ `07:35:33` Service portlama-panel status before tests: active  

## nginx failure and recovery

ℹ️ `07:35:33` Stopping nginx...  
✅ `07:35:35` API shows nginx as 'inactive' after stop  
✅ `07:35:35` nginx restart via API returned ok: true  
✅ `07:35:37` nginx is active after API restart  
✅ `07:35:37` API shows nginx as active after restart  

## chisel failure and recovery

ℹ️ `07:35:37` Stopping chisel...  
✅ `07:35:39` API shows chisel as 'inactive' after stop  
✅ `07:35:39` chisel restart via API returned ok: true  
✅ `07:35:41` chisel is active after API restart  

## authelia failure and recovery

ℹ️ `07:35:41` Stopping authelia...  
✅ `07:35:43` API shows authelia as 'inactive' after stop  
✅ `07:35:43` authelia restart via API returned ok: true  
✅ `07:35:45` authelia is active after API restart  

## Panel survives all service disruptions

✅ `07:35:45` Panel health is ok after all disruptions  
✅ `07:35:45` Service nginx is active at end of resilience test  
✅ `07:35:45` Service chisel is active at end of resilience test  
✅ `07:35:45` Service authelia is active at end of resilience test  
✅ `07:35:45` Service portlama-panel is active at end of resilience test  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

