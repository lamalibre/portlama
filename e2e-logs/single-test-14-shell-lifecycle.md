# Portlama E2E: 14 — Shell Lifecycle

> Started at `2026-03-20 11:04:05 UTC`


## Pre-flight: check onboarding is complete

✅ `11:04:05` Onboarding is complete  

## Shell config defaults

✅ `11:04:05` Shell is disabled by default  
✅ `11:04:05` Default policy ID is 'default'  
✅ `11:04:05` At least one policy exists (count: 1)  
✅ `11:04:05` Default policy has name 'Default'  

## Enable shell globally

✅ `11:04:05` PATCH shell/config returned ok: true  
✅ `11:04:05` Shell is now enabled  

## Create a shell policy

✅ `11:04:05` Policy creation returned ok: true  
✅ `11:04:05` Policy ID matches  
✅ `11:04:05` Policy name matches  
✅ `11:04:05` Inactivity timeout is 300  

## Verify policy in listing

✅ `11:04:05` Created policy appears in listing  

## Update the policy

✅ `11:04:05` Policy update returned ok: true  
✅ `11:04:05` Inactivity timeout updated to 600  
✅ `11:04:05` Description updated  
✅ `11:04:05` Updated timeout persisted in listing  

## Cannot delete the default policy

✅ `11:04:05` Cannot delete the default policy (HTTP 400)  

## Delete the e2e-test-policy

✅ `11:04:05` Policy deletion returned ok: true  
✅ `11:04:06` Deleted policy no longer in listing  

## Policy validation

✅ `11:04:06` POST policy with empty name rejected (HTTP 400)  
✅ `11:04:06` POST policy with invalid CIDR /99 rejected (HTTP 400)  
✅ `11:04:06` POST policy with duplicate ID rejected (HTTP 409)  

## Enable shell for agent

ℹ️ `11:04:06` Found agent: test-agent  
✅ `11:04:06` Shell enable for agent returned ok: true  
✅ `11:04:06` shellEnabledUntil is set  
✅ `11:04:06` shellEnabledUntil has a value: 2026-03-20T11:09:06.104Z  
✅ `11:04:06` Shell disable for agent returned ok: true  

## Shell enable without global toggle

✅ `11:04:06` Cannot enable shell for agent when globally disabled (HTTP 400)  

## Session audit log

✅ `11:04:06` GET shell/sessions returns a sessions array  

## File transfer endpoints (not yet implemented)

✅ `11:04:06` GET shell/file/:label returns 501 (not implemented)  
✅ `11:04:06` POST shell/file/:label returns 501 (not implemented)  

## Recordings listing

✅ `11:04:06` GET shell/recordings/:label returns a recordings array  
✅ `11:04:06` Recording download for non-existent session returns 404  

## Input validation

✅ `11:04:06` PATCH config with non-existent defaultPolicy rejected (HTTP 400)  
✅ `11:04:06` POST enable with durationMinutes: 0 rejected (HTTP 400)  
✅ `11:04:06` POST enable with durationMinutes: 9999 rejected (HTTP 400)  
✅ `11:04:06` POST policy with name > 100 chars rejected (HTTP 400)  
✅ `11:04:06` POST policy with invalid ID characters rejected (HTTP 400)  
✅ `11:04:06` PATCH non-existent policy returns 404  
✅ `11:04:06` DELETE non-existent policy returns 404  
✅ `11:04:06` POST enable for non-existent agent returns 404  
✅ `11:04:06` DELETE enable for non-existent agent returns 404  
✅ `11:04:06` POST enable with invalid label format rejected (HTTP 400)  
✅ `11:04:06` GET shell/file without path query rejected (HTTP 400)  
✅ `11:04:06` Recording with invalid session ID rejected (HTTP 400)  

## Cleanup

✅ `11:04:06` Shell disabled globally for cleanup  
✅ `11:04:06` Shell is disabled after cleanup  
✅ `11:04:06` Cleanup complete — shell state restored  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `47` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `47` |

