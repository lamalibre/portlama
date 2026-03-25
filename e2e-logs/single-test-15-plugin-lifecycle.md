# Portlama E2E: 15 — Plugin Lifecycle

> Started at `2026-03-25 09:21:33 UTC`


## Pre-flight: check onboarding is complete

✅ `09:21:33` Onboarding is complete  

## Empty initial plugin list

✅ `09:21:33` Initial plugin list is empty  

## Plugin install validation

✅ `09:21:33` Non-@lamalibre package rejected (HTTP 400)  
✅ `09:21:33` Empty package name rejected (HTTP 400)  

## Plugin detail for non-existent plugin

✅ `09:21:33` GET non-existent plugin returns 404  

## Enable/disable non-existent plugin

✅ `09:21:33` Enable non-existent plugin returns 404  
✅ `09:21:33` Disable non-existent plugin returns 404  

## Uninstall non-existent plugin

✅ `09:21:33` Uninstall non-existent plugin returns 404  

## Push install config defaults

✅ `09:21:33` Push install is disabled by default  
✅ `09:21:33` Default policy ID is 'default'  
✅ `09:21:33` At least one push install policy exists (count: 1)  

## Push install config update

✅ `09:21:33` PATCH push-install config returned ok: true  
✅ `09:21:33` Push install is now enabled  

## Create a push install policy

✅ `09:21:33` Policy creation returned ok: true  
✅ `09:21:33` Policy ID matches  

## Verify policy in listing

✅ `09:21:33` Created policy appears in listing  

## Update the push install policy

✅ `09:21:33` Policy update returned ok: true  
✅ `09:21:33` Description updated  

## Cannot delete the default push install policy

✅ `09:21:33` Cannot delete the default policy (HTTP 400)  

## Delete the e2e-pi-test policy

✅ `09:21:33` Policy deletion returned ok: true  
✅ `09:21:33` Deleted policy no longer in listing  

## Push install policy validation

✅ `09:21:33` POST policy with empty name rejected (HTTP 400)  
✅ `09:21:33` POST policy with duplicate ID rejected (HTTP 409)  
✅ `09:21:33` PATCH non-existent policy returns 404  
✅ `09:21:33` DELETE non-existent policy returns 404  

## Push install enable/disable for agent

ℹ️ `09:21:33` Found agent: test-agent  
✅ `09:21:33` Push install enable for agent returned ok: true  
✅ `09:21:33` pushInstallEnabledUntil is set  
✅ `09:21:33` Push install disable for agent returned ok: true  

## Push install without global toggle

✅ `09:21:33` Cannot enable push install when globally disabled (HTTP 400)  

## Push install sessions audit log

✅ `09:21:33` GET push-install sessions returns a sessions array  

## Push install input validation

✅ `09:21:33` POST enable with durationMinutes: 0 rejected (HTTP 400)  
✅ `09:21:33` POST enable with durationMinutes: 9999 rejected (HTTP 400)  
✅ `09:21:33` PATCH config with non-existent defaultPolicy rejected (HTTP 400)  
✅ `09:21:33` POST enable for non-existent agent returns 404  
✅ `09:21:33` DELETE enable for non-existent agent returns 404  
✅ `09:21:33` POST enable with invalid label format rejected (HTTP 400)  
✅ `09:21:33` GET plugin with invalid name rejected (HTTP 400)  

## Cleanup

✅ `09:21:33` Push install disabled globally for cleanup  
✅ `09:21:33` Push install is disabled after cleanup  
✅ `09:21:33` Cleanup complete — plugin state restored  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `40` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `40` |

