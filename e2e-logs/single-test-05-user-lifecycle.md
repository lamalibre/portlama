# Portlama E2E: 05 — User Lifecycle

> Started at `2026-03-29 07:35:13 UTC`


## Pre-flight: check onboarding is complete


## Create user

✅ `07:35:15` User creation returned ok: true  
✅ `07:35:15` Username matches  
✅ `07:35:15` Display name matches  
✅ `07:35:15` Email matches  

## Verify user in list

✅ `07:35:15` User appears in GET /api/users  
✅ `07:35:15` No password field in user list response  
✅ `07:35:15` No bcrypt hash in user list response  

## Validation: duplicate username

✅ `07:35:15` Duplicate username rejected (HTTP 409)  

## Validation: invalid input

✅ `07:35:15` Incomplete user data rejected (HTTP 400)  
✅ `07:35:15` Short password rejected (HTTP 400)  

## Reset TOTP

✅ `07:35:15` TOTP reset returned ok: true  
✅ `07:35:15` TOTP URI is a valid otpauth:// URI  

## TOTP for nonexistent user

✅ `07:35:15` TOTP reset for nonexistent user returns 404  

## Update user

✅ `07:35:17` User update returned ok: true  
✅ `07:35:17` Display name updated  
✅ `07:35:17` Display name persisted after update  

## Update nonexistent user

✅ `07:35:17` Update nonexistent user returns 404  

## Delete user

✅ `07:35:20` User deletion returned ok: true  
✅ `07:35:20` User no longer in list after deletion  

## Cannot delete last user

ℹ️ `07:35:20` Cannot test last-user protection — 2 users exist (need exactly 1)  
ℹ️ `07:35:20` This scenario is tested when only the admin user remains  

## Delete nonexistent user

✅ `07:35:20` Delete nonexistent user returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

