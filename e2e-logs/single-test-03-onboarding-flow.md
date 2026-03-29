# Portlama E2E: 03 — Onboarding Flow

> Started at `2026-03-29 07:35:03 UTC`


## Initial onboarding status

ℹ️ `07:35:03` Current onboarding status: COMPLETED  
ℹ️ `07:35:03` Onboarding already completed — testing post-completion behavior  
✅ `07:35:03` POST /onboarding/domain returns 410 after completion  
✅ `07:35:03` POST /onboarding/verify-dns returns 410 after completion  
✅ `07:35:03` POST /onboarding/provision returns 410 after completion  
✅ `07:35:03` GET /onboarding/status still returns 200  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `4` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `4` |

