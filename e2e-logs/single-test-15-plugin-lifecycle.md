# Portlama E2E: 15 — Plugin Lifecycle

> Started at `2026-03-25 18:03:23 UTC`


## Pre-flight: check onboarding is complete

✅ `18:03:23` Onboarding is complete  

## Empty initial plugin list

✅ `18:03:23` Initial plugin list is empty  

## Plugin install validation

✅ `18:03:23` Non-@lamalibre package rejected (HTTP 400)  
✅ `18:03:23` Empty package name rejected (HTTP 400)  

## Plugin detail for non-existent plugin

✅ `18:03:23` GET non-existent plugin returns 404  

## Enable/disable non-existent plugin

✅ `18:03:23` Enable non-existent plugin returns 404  
✅ `18:03:23` Disable non-existent plugin returns 404  

## Uninstall non-existent plugin

✅ `18:03:23` Uninstall non-existent plugin returns 404  

## Push install config defaults

✅ `18:03:23` Push install is disabled by default  
✅ `18:03:23` Default policy ID is 'default'  
✅ `18:03:23` At least one push install policy exists (count: 1)  

## Push install config update

✅ `18:03:23` PATCH push-install config returned ok: true  
✅ `18:03:23` Push install is now enabled  

## Create a push install policy

✅ `18:03:23` Policy creation returned ok: true  
✅ `18:03:23` Policy ID matches  

## Verify policy in listing

✅ `18:03:23` Created policy appears in listing  

## Update the push install policy

✅ `18:03:24` Policy update returned ok: true  
✅ `18:03:24` Description updated  

## Cannot delete the default push install policy

✅ `18:03:24` Cannot delete the default policy (HTTP 400)  

## Delete the e2e-pi-test policy

✅ `18:03:24` Policy deletion returned ok: true  
✅ `18:03:24` Deleted policy no longer in listing  

## Push install policy validation

✅ `18:03:24` POST policy with empty name rejected (HTTP 400)  
✅ `18:03:24` POST policy with duplicate ID rejected (HTTP 409)  
✅ `18:03:24` PATCH non-existent policy returns 404  
✅ `18:03:24` DELETE non-existent policy returns 404  

## Push install enable/disable for agent

ℹ️ `18:03:24` Found agent: test-agent  
✅ `18:03:24` Push install enable for agent returned ok: true  
✅ `18:03:24` pushInstallEnabledUntil is set  
✅ `18:03:24` Push install disable for agent returned ok: true  

## Push install without global toggle

✅ `18:03:24` Cannot enable push install when globally disabled (HTTP 400)  

## Push install sessions audit log

✅ `18:03:24` GET push-install sessions returns a sessions array  

## Push install input validation

✅ `18:03:24` POST enable with durationMinutes: 0 rejected (HTTP 400)  
✅ `18:03:24` POST enable with durationMinutes: 9999 rejected (HTTP 400)  
✅ `18:03:24` PATCH config with non-existent defaultPolicy rejected (HTTP 400)  
✅ `18:03:24` POST enable for non-existent agent returns 404  
✅ `18:03:24` DELETE enable for non-existent agent returns 404  
✅ `18:03:24` POST enable with invalid label format rejected (HTTP 400)  
✅ `18:03:24` GET plugin with invalid name rejected (HTTP 400)  

## Cleanup

✅ `18:03:24` Push install disabled globally for cleanup  
✅ `18:03:24` Push install is disabled after cleanup  
✅ `18:03:24` Cleanup complete — plugin state restored  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `40` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `40` |

