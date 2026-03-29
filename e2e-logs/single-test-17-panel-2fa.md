# Portlama E2E: 17 — Panel Built-in TOTP 2FA

> Started at `2026-03-29 07:35:57 UTC`


## Pre-flight: check onboarding is complete


## Default state: 2FA disabled

✅ `07:35:57` 2FA is disabled by default  
✅ `07:35:57` setupComplete is false by default  

## Setup: generate TOTP secret

✅ `07:35:57` Setup returns otpauth URI  
✅ `07:35:57` Setup returns manual key  
✅ `07:35:57` URI is valid otpauth format  

## Confirm 2FA with valid code

✅ `07:35:57` Generated TOTP code  
ℹ️ `07:35:57` Generated TOTP code: 124970  
✅ `07:35:57` 2FA is now enabled  
✅ `07:35:57` Session cookie received on confirm  
✅ `07:35:57` Status shows enabled after confirm  

## IP vhost disabled after enabling 2FA

✅ `07:35:59` IP:9292 vhost is disabled (HTTP 000)  

## Request without session returns 401 2fa_required

✅ `07:35:59` Request without session cookie returns 401  

## Authenticated request with session cookie

✅ `07:35:59` Authenticated request with session cookie returns system stats  

## Disable 2FA

ℹ️ `07:35:59` Waiting 2s for next TOTP window...  
✅ `07:36:01` 2FA disabled successfully  

## IP vhost re-enabled after disabling 2FA

✅ `07:36:03` IP:9292 vhost is re-enabled after disabling 2FA  
✅ `07:36:03` 2FA status is disabled  

## Reset admin clears 2FA

✅ `07:36:03` 2FA re-enabled for reset test  
✅ `07:36:08` 2FA disabled after reset-admin  
✅ `07:36:08` IP vhost restored after reset-admin  

## Rate limiting on wrong codes

✅ `07:36:10` Rate limiting kicks in after 6 wrong attempts (HTTP 429)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `19` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `19` |

