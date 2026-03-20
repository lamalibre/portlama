# Portlama E2E: 06 — Tunnel User Journey (Three-VM)

> Started at `2026-03-20 11:05:41 UTC`


## Pre-flight: verify onboarding is complete


## Step 1: Create tunnel and establish connection

✅ `11:05:44` Tunnel creation returned ok: true  
✅ `11:05:44` Tunnel has an ID  
ℹ️ `11:05:44` Created tunnel ID: 4b98f089-eaa4-4738-9947-8224e3ca5acb (e2ejourney.test.portlama.local)  
✅ `11:05:44` Added DNS entries to agent /etc/hosts  
✅ `11:05:45` Added e2ejourney.test.portlama.local to visitor /etc/hosts  
✅ `11:05:47` HTTP server running on agent at port 18090  
ℹ️ `11:05:47` Waiting for Chisel tunnel to establish...  
✅ `11:05:47` Chisel tunnel established (port 18090 accessible on host)  

## Step 2: Prepare TOTP for test user

✅ `11:05:47` oathtool is available on visitor VM  
✅ `11:05:47` TOTP reset returned otpauth URI  
✅ `11:05:47` Extracted TOTP secret from otpauth URI  
✅ `11:05:50` oathtool generates valid TOTP codes for this secret  

## Step 3: Unauthenticated access redirects to Authelia (from visitor VM)

✅ `11:05:50` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `11:05:50` Redirect URL contains auth.test.portlama.local  
✅ `11:05:50` Tunnel content is NOT visible without authentication  

## Step 4: First factor authentication from visitor VM (username/password)

✅ `11:05:51` First factor authentication succeeded (username/password accepted)  

## Step 5: Second factor authentication from visitor VM (TOTP)

ℹ️ `11:05:51` Generated TOTP code: 697685  
✅ `11:05:51` Second factor authentication succeeded (TOTP accepted)  

## Step 6: Authenticated access from visitor VM shows tunnel content

✅ `11:05:51` Authenticated request returns tunnel content (full 2FA path verified)  
✅ `11:05:52` Authenticated request returns HTTP 200  

## Step 7: Session persistence (no re-auth needed, from visitor VM)

✅ `11:05:52` Session persists — second request returns tunnel content without re-auth  
✅ `11:05:52` Session persists — HTTP 200 on second request  

## Step 8: Invalid session redirects to Authelia again (from visitor VM)

✅ `11:05:52` Invalid/expired session rejected (HTTP 302)  
✅ `11:05:52` Invalid session does not expose tunnel content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `11:05:52` Cleaning up test resources...  
🔵 `11:05:55` **Running: 07-site-visitor-journey.sh**  
