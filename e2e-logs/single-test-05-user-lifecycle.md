# Portlama E2E: 05 — User Lifecycle

> Started at `2026-03-25 18:02:43 UTC`


## Pre-flight: check onboarding is complete


## Create user

✅ `18:02:46` User creation returned ok: true  
✅ `18:02:46` Username matches  
✅ `18:02:46` Display name matches  
✅ `18:02:46` Email matches  

## Verify user in list

✅ `18:02:46` User appears in GET /api/users  
✅ `18:02:46` No password field in user list response  
✅ `18:02:46` No bcrypt hash in user list response  

## Validation: duplicate username

✅ `18:02:46` Duplicate username rejected (HTTP 409)  

## Validation: invalid input

✅ `18:02:46` Incomplete user data rejected (HTTP 400)  
✅ `18:02:46` Short password rejected (HTTP 400)  

## Reset TOTP

✅ `18:02:46` TOTP reset returned ok: true  
✅ `18:02:46` TOTP URI is a valid otpauth:// URI  

## TOTP for nonexistent user

✅ `18:02:46` TOTP reset for nonexistent user returns 404  

## Update user

✅ `18:02:48` User update returned ok: true  
✅ `18:02:48` Display name updated  
✅ `18:02:48` Display name persisted after update  

## Update nonexistent user

✅ `18:02:48` Update nonexistent user returns 404  

## Delete user

✅ `18:02:50` User deletion returned ok: true  
✅ `18:02:50` User no longer in list after deletion  

## Cannot delete last user

ℹ️ `18:02:50` Cannot test last-user protection — 2 users exist (need exactly 1)  
ℹ️ `18:02:50` This scenario is tested when only the admin user remains  

## Delete nonexistent user

✅ `18:02:50` Delete nonexistent user returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

