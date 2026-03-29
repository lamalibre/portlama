# Portlama E2E: 07 — Static Site Visitor Journey (Three-VM)

> Started at `2026-03-29 07:38:50 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Create managed static site via API

✅ `07:38:51` Site creation returned ok: true  
✅ `07:38:51` Site has an ID  
ℹ️ `07:38:51` Created site ID: e7d40e17-60f4-46bc-99be-d1ca9e468c88 (e2eblog.test.portlama.local)  
✅ `07:38:51` Site FQDN matches expected value  

## Write test index.html to site directory

✅ `07:38:51` index.html written to site directory  

## Visit site from visitor VM WITHOUT auth — should redirect to Authelia

✅ `07:38:54` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `07:38:54` Redirect points to Authelia portal (auth.test.portlama.local)  

## Reset TOTP before authentication

✅ `07:38:54` TOTP reset succeeded, got otpauth URI  

## Authenticate with Authelia from visitor VM (firstfactor)

✅ `07:38:57` Authelia firstfactor authentication succeeded  

## Authenticate with Authelia from visitor VM (secondfactor TOTP)

✅ `07:38:57` Generated TOTP code with oathtool on visitor VM  
✅ `07:38:57` Authelia secondfactor TOTP authentication succeeded  

## Visit site from visitor VM WITH auth — should return content

✅ `07:38:57` Authenticated request returns site content  
✅ `07:38:58` Authenticated request returns HTTP 200  

## Disable Authelia protection

✅ `07:39:00` Disable Authelia protection returned ok: true  
✅ `07:39:00` Site shows autheliaProtected: false  

## Visit site from visitor VM WITHOUT auth — should now return content (unprotected)

✅ `07:39:02` Unprotected site returns HTTP 200 without auth  
✅ `07:39:02` Unprotected site returns expected content  

## Re-enable Authelia protection

✅ `07:39:05` Re-enable Authelia protection returned ok: true  
✅ `07:39:05` Site shows autheliaProtected: true  

## Verify protection is back — visitor without auth should redirect

✅ `07:39:07` Re-protected site redirects/rejects unauthenticated request (HTTP 302)  

## Cleanup: delete site via API

✅ `07:39:07` Site deletion returned ok: true  
✅ `07:39:07` Site no longer appears in site list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `07:39:07` Cleaning up test resources...  
🔵 `07:39:07` **Running: 08-invitation-journey.sh**  
