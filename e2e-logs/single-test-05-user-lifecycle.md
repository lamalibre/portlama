# Portlama E2E: 05 — User Lifecycle

> Started at `2026-03-23 18:41:02 UTC`


## Pre-flight: check onboarding is complete


## Create user

✅ `18:41:05` User creation returned ok: true  
✅ `18:41:05` Username matches  
✅ `18:41:05` Display name matches  
✅ `18:41:05` Email matches  

## Verify user in list

✅ `18:41:05` User appears in GET /api/users  
✅ `18:41:05` No password field in user list response  
✅ `18:41:05` No bcrypt hash in user list response  

## Validation: duplicate username

✅ `18:41:05` Duplicate username rejected (HTTP 409)  

## Validation: invalid input

✅ `18:41:05` Incomplete user data rejected (HTTP 400)  
✅ `18:41:05` Short password rejected (HTTP 400)  

## Reset TOTP

✅ `18:41:05` TOTP reset returned ok: true  
✅ `18:41:05` TOTP URI is a valid otpauth:// URI  

## TOTP for nonexistent user

✅ `18:41:05` TOTP reset for nonexistent user returns 404  

## Update user

✅ `18:41:07` User update returned ok: true  
✅ `18:41:07` Display name updated  
✅ `18:41:07` Display name persisted after update  

## Update nonexistent user

✅ `18:41:07` Update nonexistent user returns 404  

## Delete user

✅ `18:41:09` User deletion returned ok: true  
✅ `18:41:09` User no longer in list after deletion  

## Cannot delete last user

ℹ️ `18:41:09` Cannot test last-user protection — 2 users exist (need exactly 1)  
ℹ️ `18:41:09` This scenario is tested when only the admin user remains  

## Delete nonexistent user

✅ `18:41:10` Delete nonexistent user returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

