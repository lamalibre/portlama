# Portlama E2E: 07 — Static Site Visitor Journey (Three-VM)

> Started at `2026-03-23 18:43:48 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Create managed static site via API

✅ `18:43:49` Site creation returned ok: true  
✅ `18:43:49` Site has an ID  
ℹ️ `18:43:49` Created site ID: a10c8108-e12d-4a77-b2c6-1202533bf760 (e2eblog.test.portlama.local)  
✅ `18:43:49` Site FQDN matches expected value  

## Write test index.html to site directory

✅ `18:43:49` index.html written to site directory  

## Visit site from visitor VM WITHOUT auth — should redirect to Authelia

✅ `18:43:52` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:43:52` Redirect points to Authelia portal (auth.test.portlama.local)  

## Reset TOTP before authentication

✅ `18:43:52` TOTP reset succeeded, got otpauth URI  

## Authenticate with Authelia from visitor VM (firstfactor)

✅ `18:43:55` Authelia firstfactor authentication succeeded  

## Authenticate with Authelia from visitor VM (secondfactor TOTP)

✅ `18:43:55` Generated TOTP code with oathtool on visitor VM  
✅ `18:43:55` Authelia secondfactor TOTP authentication succeeded  

## Visit site from visitor VM WITH auth — should return content

✅ `18:43:56` Authenticated request returns site content  
✅ `18:43:56` Authenticated request returns HTTP 200  

## Disable Authelia protection

✅ `18:43:58` Disable Authelia protection returned ok: true  
✅ `18:43:58` Site shows autheliaProtected: false  

## Visit site from visitor VM WITHOUT auth — should now return content (unprotected)

✅ `18:44:01` Unprotected site returns HTTP 200 without auth  
✅ `18:44:01` Unprotected site returns expected content  

## Re-enable Authelia protection

✅ `18:44:03` Re-enable Authelia protection returned ok: true  
✅ `18:44:03` Site shows autheliaProtected: true  

## Verify protection is back — visitor without auth should redirect

✅ `18:44:05` Re-protected site redirects/rejects unauthenticated request (HTTP 302)  

## Cleanup: delete site via API

✅ `18:44:06` Site deletion returned ok: true  
✅ `18:44:06` Site no longer appears in site list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `18:44:06` Cleaning up test resources...  
🔵 `18:44:06` **Running: 08-invitation-journey.sh**  
