# Portlama E2E: 08 — Invitation Journey (Three-VM)

> Started at `2026-03-23 18:44:10 UTC`


## Pre-flight: verify onboarding is complete


## Pre-flight: ensure oathtool is available on visitor VM


## Admin creates invitation

✅ `18:44:10` Invitation creation returned ok: true  
✅ `18:44:10` Invitation has a token  
✅ `18:44:10` Invitation has an ID  
✅ `18:44:10` Invitation has an invite URL  
ℹ️ `18:44:10` Created invitation for inviteduser (token: 35cd481c2a9c01a3...)  
✅ `18:44:10` Invitation appears in admin invitation list  

## Visit invitation page from visitor VM (public, no mTLS)

✅ `18:44:11` Invite page returns correct username  
✅ `18:44:11` Invite page returns correct email  
✅ `18:44:11` Invite page returns expiresAt  

## Accept invitation from visitor VM (public, no mTLS)

✅ `18:44:13` Invitation acceptance returned ok: true  
✅ `18:44:13` Acceptance response returns correct username  
ℹ️ `18:44:13` User inviteduser created via invitation  

## Verify user appears in admin's user list

✅ `18:44:13` Invited user appears in admin user list  

## Reset TOTP for invited user before authentication

✅ `18:44:13` TOTP reset succeeded for invited user  

## New user authenticates from visitor VM (firstfactor)

✅ `18:44:17` Invited user firstfactor authentication succeeded  

## New user authenticates from visitor VM (secondfactor TOTP)

✅ `18:44:17` Generated TOTP code for invited user on visitor VM  
✅ `18:44:17` Invited user secondfactor TOTP authentication succeeded  
✅ `18:44:17` Invited user session is valid (verify returned 200)  

## Used invitation token is rejected (from visitor VM)

✅ `18:44:17` Used invitation token returns 410 Gone  
✅ `18:44:17` Used invitation token acceptance returns 410 Gone  

## Cleanup: delete invited user

✅ `18:44:20` Invited user deletion returned ok: true  
✅ `18:44:20` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

ℹ️ `18:44:20` Cleaning up test resources...  
🔵 `18:44:20` **Running: 09-agent-site-deploy.sh**  
