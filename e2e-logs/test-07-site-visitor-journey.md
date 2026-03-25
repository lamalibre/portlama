# Portlama E2E: 07 — Static Site Visitor Journey (Three-VM)

> Started at `2026-03-25 18:06:37 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Create managed static site via API

✅ `18:06:38` Site creation returned ok: true  
✅ `18:06:38` Site has an ID  
ℹ️ `18:06:38` Created site ID: bf919eda-e9db-466a-8e3c-539f5a94755f (e2eblog.test.portlama.local)  
✅ `18:06:38` Site FQDN matches expected value  

## Write test index.html to site directory

✅ `18:06:38` index.html written to site directory  

## Visit site from visitor VM WITHOUT auth — should redirect to Authelia

✅ `18:06:40` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:06:40` Redirect points to Authelia portal (auth.test.portlama.local)  

## Reset TOTP before authentication

✅ `18:06:41` TOTP reset succeeded, got otpauth URI  

## Authenticate with Authelia from visitor VM (firstfactor)

✅ `18:06:44` Authelia firstfactor authentication succeeded  

## Authenticate with Authelia from visitor VM (secondfactor TOTP)

✅ `18:06:44` Generated TOTP code with oathtool on visitor VM  
✅ `18:06:44` Authelia secondfactor TOTP authentication succeeded  

## Visit site from visitor VM WITH auth — should return content

✅ `18:06:44` Authenticated request returns site content  
✅ `18:06:44` Authenticated request returns HTTP 200  

## Disable Authelia protection

✅ `18:06:47` Disable Authelia protection returned ok: true  
✅ `18:06:47` Site shows autheliaProtected: false  

## Visit site from visitor VM WITHOUT auth — should now return content (unprotected)

✅ `18:06:49` Unprotected site returns HTTP 200 without auth  
✅ `18:06:49` Unprotected site returns expected content  

## Re-enable Authelia protection

✅ `18:06:52` Re-enable Authelia protection returned ok: true  
✅ `18:06:52` Site shows autheliaProtected: true  

## Verify protection is back — visitor without auth should redirect

✅ `18:06:54` Re-protected site redirects/rejects unauthenticated request (HTTP 302)  

## Cleanup: delete site via API

✅ `18:06:54` Site deletion returned ok: true  
✅ `18:06:54` Site no longer appears in site list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `18:06:54` Cleaning up test resources...  
🔵 `18:06:54` **Running: 08-invitation-journey.sh**  
