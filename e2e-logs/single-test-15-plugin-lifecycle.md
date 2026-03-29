# Portlama E2E: 15 — Plugin Lifecycle

> Started at `2026-03-29 07:35:52 UTC`


## Pre-flight: check onboarding is complete

✅ `07:35:52` Onboarding is complete  

## Empty initial plugin list

✅ `07:35:52` Initial plugin list is empty  

## Plugin install validation

✅ `07:35:52` Non-@lamalibre package rejected (HTTP 400)  
✅ `07:35:52` Empty package name rejected (HTTP 400)  

## Plugin detail for non-existent plugin

✅ `07:35:52` GET non-existent plugin returns 404  

## Enable/disable non-existent plugin

✅ `07:35:52` Enable non-existent plugin returns 404  
✅ `07:35:52` Disable non-existent plugin returns 404  

## Uninstall non-existent plugin

✅ `07:35:52` Uninstall non-existent plugin returns 404  

## Push install config defaults

✅ `07:35:52` Push install is disabled by default  
✅ `07:35:52` Default policy ID is 'default'  
✅ `07:35:52` At least one push install policy exists (count: 1)  

## Push install config update

✅ `07:35:52` PATCH push-install config returned ok: true  
✅ `07:35:52` Push install is now enabled  

## Create a push install policy

✅ `07:35:52` Policy creation returned ok: true  
✅ `07:35:52` Policy ID matches  

## Verify policy in listing

✅ `07:35:52` Created policy appears in listing  

## Update the push install policy

✅ `07:35:52` Policy update returned ok: true  
✅ `07:35:52` Description updated  

## Cannot delete the default push install policy

✅ `07:35:52` Cannot delete the default policy (HTTP 400)  

## Delete the e2e-pi-test policy

✅ `07:35:52` Policy deletion returned ok: true  
✅ `07:35:52` Deleted policy no longer in listing  

## Push install policy validation

✅ `07:35:52` POST policy with empty name rejected (HTTP 400)  
✅ `07:35:52` POST policy with duplicate ID rejected (HTTP 409)  
✅ `07:35:52` PATCH non-existent policy returns 404  
✅ `07:35:52` DELETE non-existent policy returns 404  

## Push install enable/disable for agent

ℹ️ `07:35:52` Found agent: test-agent  
✅ `07:35:52` Push install enable for agent returned ok: true  
✅ `07:35:52` pushInstallEnabledUntil is set  
✅ `07:35:52` Push install disable for agent returned ok: true  

## Push install without global toggle

✅ `07:35:52` Cannot enable push install when globally disabled (HTTP 400)  

## Push install sessions audit log

✅ `07:35:52` GET push-install sessions returns a sessions array  

## Push install input validation

✅ `07:35:52` POST enable with durationMinutes: 0 rejected (HTTP 400)  
✅ `07:35:52` POST enable with durationMinutes: 9999 rejected (HTTP 400)  
✅ `07:35:52` PATCH config with non-existent defaultPolicy rejected (HTTP 400)  
✅ `07:35:52` POST enable for non-existent agent returns 404  
✅ `07:35:52` DELETE enable for non-existent agent returns 404  
✅ `07:35:52` POST enable with invalid label format rejected (HTTP 400)  
✅ `07:35:52` GET plugin with invalid name rejected (HTTP 400)  

## Cleanup

✅ `07:35:52` Push install disabled globally for cleanup  
✅ `07:35:52` Push install is disabled after cleanup  
✅ `07:35:52` Cleanup complete — plugin state restored  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `40` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `40` |

