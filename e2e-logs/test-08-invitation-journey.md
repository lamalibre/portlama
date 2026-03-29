# Portlama E2E: 08 — Invitation Journey (Three-VM)

> Started at `2026-03-29 07:39:11 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Admin creates invitation

✅ `07:39:11` Invitation creation returned ok: true  
✅ `07:39:11` Invitation has a token  
✅ `07:39:11` Invitation has an ID  
✅ `07:39:11` Invitation has an invite URL  
ℹ️ `07:39:11` Created invitation for inviteduser (token: 6cec081ee3eeb0c8...)  
✅ `07:39:11` Invitation appears in admin invitation list  

## Visit invitation page from visitor VM (public, no mTLS)

✅ `07:39:11` Invite page returns correct username  
✅ `07:39:11` Invite page returns correct email  
✅ `07:39:11` Invite page returns expiresAt  

## Accept invitation from visitor VM (public, no mTLS)

✅ `07:39:14` Invitation acceptance returned ok: true  
✅ `07:39:14` Acceptance response returns correct username  
ℹ️ `07:39:14` User inviteduser created via invitation  

## Verify user appears in admin's user list

✅ `07:39:14` Invited user appears in admin user list  

## Reset TOTP for invited user before authentication

✅ `07:39:14` TOTP reset succeeded for invited user  

## New user authenticates from visitor VM (firstfactor)

✅ `07:39:17` Invited user firstfactor authentication succeeded  

## New user authenticates from visitor VM (secondfactor TOTP)

✅ `07:39:17` Generated TOTP code for invited user on visitor VM  
✅ `07:39:17` Invited user secondfactor TOTP authentication succeeded  
✅ `07:39:17` Invited user session is valid (verify returned 200)  

## Used invitation token is rejected (from visitor VM)

✅ `07:39:17` Used invitation token returns 410 Gone  
✅ `07:39:17` Used invitation token acceptance returns 410 Gone  

## Cleanup: delete invited user

✅ `07:39:20` Invited user deletion returned ok: true  
✅ `07:39:20` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

ℹ️ `07:39:20` Cleaning up test resources...  
🔵 `07:39:20` **Running: 09-agent-site-deploy.sh**  
