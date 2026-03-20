# Portlama E2E: 07 — Static Site Visitor Journey (Three-VM)

> Started at `2026-03-20 11:05:59 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Create managed static site via API

✅ `11:05:59` Site creation returned ok: true  
✅ `11:05:59` Site has an ID  
ℹ️ `11:05:59` Created site ID: f44ac364-6a01-4a78-8bb3-c8a69e7770c4 (e2eblog.test.portlama.local)  
✅ `11:05:59` Site FQDN matches expected value  

## Write test index.html to site directory

✅ `11:05:59` index.html written to site directory  

## Visit site from visitor VM WITHOUT auth — should redirect to Authelia

✅ `11:06:02` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `11:06:02` Redirect points to Authelia portal (auth.test.portlama.local)  

## Reset TOTP before authentication

✅ `11:06:02` TOTP reset succeeded, got otpauth URI  

## Authenticate with Authelia from visitor VM (firstfactor)

✅ `11:06:05` Authelia firstfactor authentication succeeded  

## Authenticate with Authelia from visitor VM (secondfactor TOTP)

✅ `11:06:05` Generated TOTP code with oathtool on visitor VM  
✅ `11:06:05` Authelia secondfactor TOTP authentication succeeded  

## Visit site from visitor VM WITH auth — should return content

✅ `11:06:06` Authenticated request returns site content  
✅ `11:06:06` Authenticated request returns HTTP 200  

## Disable Authelia protection

✅ `11:06:08` Disable Authelia protection returned ok: true  
✅ `11:06:08` Site shows autheliaProtected: false  

## Visit site from visitor VM WITHOUT auth — should now return content (unprotected)

✅ `11:06:10` Unprotected site returns HTTP 200 without auth  
✅ `11:06:10` Unprotected site returns expected content  

## Re-enable Authelia protection

✅ `11:06:13` Re-enable Authelia protection returned ok: true  
✅ `11:06:13` Site shows autheliaProtected: true  

## Verify protection is back — visitor without auth should redirect

✅ `11:06:15` Re-protected site redirects/rejects unauthenticated request (HTTP 302)  

## Cleanup: delete site via API

✅ `11:06:15` Site deletion returned ok: true  
✅ `11:06:16` Site no longer appears in site list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `11:06:16` Cleaning up test resources...  
🔵 `11:06:16` **Running: 08-invitation-journey.sh**  
