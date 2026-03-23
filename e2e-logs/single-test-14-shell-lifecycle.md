# Portlama E2E: 14 — Shell Lifecycle

> Started at `2026-03-23 18:41:44 UTC`


## Pre-flight: check onboarding is complete

✅ `18:41:44` Onboarding is complete  

## Shell config defaults

✅ `18:41:44` Shell is disabled by default  
✅ `18:41:44` Default policy ID is 'default'  
✅ `18:41:44` At least one policy exists (count: 1)  
✅ `18:41:44` Default policy has name 'Default'  

## Enable shell globally

✅ `18:41:44` PATCH shell/config returned ok: true  
✅ `18:41:44` Shell is now enabled  

## Create a shell policy

✅ `18:41:44` Policy creation returned ok: true  
✅ `18:41:44` Policy ID matches  
✅ `18:41:44` Policy name matches  
✅ `18:41:44` Inactivity timeout is 300  

## Verify policy in listing

✅ `18:41:45` Created policy appears in listing  

## Update the policy

✅ `18:41:45` Policy update returned ok: true  
✅ `18:41:45` Inactivity timeout updated to 600  
✅ `18:41:45` Description updated  
✅ `18:41:45` Updated timeout persisted in listing  

## Cannot delete the default policy

✅ `18:41:45` Cannot delete the default policy (HTTP 400)  

## Delete the e2e-test-policy

✅ `18:41:45` Policy deletion returned ok: true  
✅ `18:41:45` Deleted policy no longer in listing  

## Policy validation

✅ `18:41:45` POST policy with empty name rejected (HTTP 400)  
✅ `18:41:45` POST policy with invalid CIDR /99 rejected (HTTP 400)  
✅ `18:41:45` POST policy with duplicate ID rejected (HTTP 409)  

## Enable shell for agent

ℹ️ `18:41:45` Found agent: test-agent  
✅ `18:41:45` Shell enable for agent returned ok: true  
✅ `18:41:45` shellEnabledUntil is set  
✅ `18:41:45` shellEnabledUntil has a value: 2026-03-23T18:46:45.205Z  
✅ `18:41:45` Shell disable for agent returned ok: true  

## Shell enable without global toggle

✅ `18:41:45` Cannot enable shell for agent when globally disabled (HTTP 400)  

## Session audit log

✅ `18:41:45` GET shell/sessions returns a sessions array  

## File transfer endpoints (not yet implemented)

✅ `18:41:45` GET shell/file/:label returns 501 (not implemented)  
✅ `18:41:45` POST shell/file/:label returns 501 (not implemented)  

## Recordings listing

✅ `18:41:45` GET shell/recordings/:label returns a recordings array  
✅ `18:41:45` Recording download for non-existent session returns 404  

## Input validation

✅ `18:41:45` PATCH config with non-existent defaultPolicy rejected (HTTP 400)  
✅ `18:41:45` POST enable with durationMinutes: 0 rejected (HTTP 400)  
✅ `18:41:45` POST enable with durationMinutes: 9999 rejected (HTTP 400)  
✅ `18:41:45` POST policy with name > 100 chars rejected (HTTP 400)  
✅ `18:41:45` POST policy with invalid ID characters rejected (HTTP 400)  
✅ `18:41:45` PATCH non-existent policy returns 404  
✅ `18:41:45` DELETE non-existent policy returns 404  
✅ `18:41:45` POST enable for non-existent agent returns 404  
✅ `18:41:45` DELETE enable for non-existent agent returns 404  
✅ `18:41:45` POST enable with invalid label format rejected (HTTP 400)  
✅ `18:41:45` GET shell/file without path query rejected (HTTP 400)  
✅ `18:41:45` Recording with invalid session ID rejected (HTTP 400)  

## Cleanup

✅ `18:41:45` Shell disabled globally for cleanup  
✅ `18:41:45` Shell is disabled after cleanup  
✅ `18:41:45` Cleanup complete — shell state restored  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `47` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `47` |

