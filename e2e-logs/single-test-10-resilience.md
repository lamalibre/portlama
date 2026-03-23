# Portlama E2E: 10 — Resilience

> Started at `2026-03-23 18:41:25 UTC`


## Pre-flight: check onboarding is complete

ℹ️ `18:41:25` Service nginx status before tests: active  
ℹ️ `18:41:25` Service chisel status before tests: active  
ℹ️ `18:41:25` Service authelia status before tests: active  
ℹ️ `18:41:25` Service portlama-panel status before tests: active  

## nginx failure and recovery

ℹ️ `18:41:25` Stopping nginx...  
✅ `18:41:27` API shows nginx as 'inactive' after stop  
✅ `18:41:27` nginx restart via API returned ok: true  
✅ `18:41:29` nginx is active after API restart  
✅ `18:41:29` API shows nginx as active after restart  

## chisel failure and recovery

ℹ️ `18:41:29` Stopping chisel...  
✅ `18:41:31` API shows chisel as 'inactive' after stop  
✅ `18:41:31` chisel restart via API returned ok: true  
✅ `18:41:33` chisel is active after API restart  

## authelia failure and recovery

ℹ️ `18:41:33` Stopping authelia...  
✅ `18:41:36` API shows authelia as 'inactive' after stop  
✅ `18:41:36` authelia restart via API returned ok: true  
✅ `18:41:38` authelia is active after API restart  

## Panel survives all service disruptions

✅ `18:41:38` Panel health is ok after all disruptions  
✅ `18:41:38` Service nginx is active at end of resilience test  
✅ `18:41:38` Service chisel is active at end of resilience test  
✅ `18:41:38` Service authelia is active at end of resilience test  
✅ `18:41:38` Service portlama-panel is active at end of resilience test  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `15` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `15` |

