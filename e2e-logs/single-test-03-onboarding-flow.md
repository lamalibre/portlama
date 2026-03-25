# Portlama E2E: 03 — Onboarding Flow

> Started at `2026-03-25 09:20:45 UTC`


## Initial onboarding status

ℹ️ `09:20:45` Current onboarding status: COMPLETED  
ℹ️ `09:20:45` Onboarding already completed — testing post-completion behavior  
✅ `09:20:45` POST /onboarding/domain returns 410 after completion  
✅ `09:20:45` POST /onboarding/verify-dns returns 410 after completion  
✅ `09:20:45` POST /onboarding/provision returns 410 after completion  
✅ `09:20:45` GET /onboarding/status still returns 200  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `4` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `4` |

