# Portlama E2E: 17 — Panel Built-in TOTP 2FA

> Started at `2026-03-25 18:03:29 UTC`


## Pre-flight: check onboarding is complete


## Default state: 2FA disabled

✅ `18:03:29` 2FA is disabled by default  
✅ `18:03:29` setupComplete is false by default  

## Setup: generate TOTP secret

✅ `18:03:29` Setup returns otpauth URI  
✅ `18:03:29` Setup returns manual key  
✅ `18:03:29` URI is valid otpauth format  

## Confirm 2FA with valid code

✅ `18:03:29` Generated TOTP code  
ℹ️ `18:03:29` Generated TOTP code: 804530  
✅ `18:03:29` 2FA is now enabled  
✅ `18:03:29` Session cookie received on confirm  
✅ `18:03:30` Status shows enabled after confirm  

## IP vhost disabled after enabling 2FA

✅ `18:03:32` IP:9292 vhost is disabled (HTTP 000)  

## Request without session returns 401 2fa_required

✅ `18:03:32` Request without session cookie returns 401  

## Authenticated request with session cookie

✅ `18:03:32` Authenticated request with session cookie returns system stats  

## Disable 2FA

ℹ️ `18:03:32` Waiting 29s for next TOTP window...  
✅ `18:04:01` 2FA disabled successfully  

## IP vhost re-enabled after disabling 2FA

✅ `18:04:03` IP:9292 vhost is re-enabled after disabling 2FA  
✅ `18:04:03` 2FA status is disabled  

## Reset admin clears 2FA

✅ `18:04:03` 2FA re-enabled for reset test  
✅ `18:04:07` 2FA disabled after reset-admin  
✅ `18:04:07` IP vhost restored after reset-admin  

## Rate limiting on wrong codes

✅ `18:04:09` Rate limiting kicks in after 6 wrong attempts (HTTP 429)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `19` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `19` |

