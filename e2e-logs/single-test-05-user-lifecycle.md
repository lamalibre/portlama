# Portlama E2E: 05 — User Lifecycle

> Started at `2026-03-20 11:03:26 UTC`


## Pre-flight: check onboarding is complete


## Create user

✅ `11:03:28` User creation returned ok: true  
✅ `11:03:28` Username matches  
✅ `11:03:28` Display name matches  
✅ `11:03:28` Email matches  

## Verify user in list

✅ `11:03:28` User appears in GET /api/users  
✅ `11:03:28` No password field in user list response  
✅ `11:03:28` No bcrypt hash in user list response  

## Validation: duplicate username

✅ `11:03:29` Duplicate username rejected (HTTP 409)  

## Validation: invalid input

✅ `11:03:29` Incomplete user data rejected (HTTP 400)  
✅ `11:03:29` Short password rejected (HTTP 400)  

## Reset TOTP

✅ `11:03:29` TOTP reset returned ok: true  
✅ `11:03:29` TOTP URI is a valid otpauth:// URI  

## TOTP for nonexistent user

✅ `11:03:29` TOTP reset for nonexistent user returns 404  

## Update user

✅ `11:03:31` User update returned ok: true  
✅ `11:03:31` Display name updated  
✅ `11:03:31` Display name persisted after update  

## Update nonexistent user

✅ `11:03:31` Update nonexistent user returns 404  

## Delete user

✅ `11:03:33` User deletion returned ok: true  
✅ `11:03:33` User no longer in list after deletion  

## Cannot delete last user

ℹ️ `11:03:33` Cannot test last-user protection — 2 users exist (need exactly 1)  
ℹ️ `11:03:33` This scenario is tested when only the admin user remains  

## Delete nonexistent user

✅ `11:03:33` Delete nonexistent user returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

