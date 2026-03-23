# Portlama E2E: 06 — Tunnel User Journey (Three-VM)

> Started at `2026-03-23 18:43:31 UTC`


## Pre-flight: verify onboarding is complete


## Step 1: Create tunnel and establish connection

✅ `18:43:34` Tunnel creation returned ok: true  
✅ `18:43:34` Tunnel has an ID  
ℹ️ `18:43:34` Created tunnel ID: b991c0fd-8f9a-458f-9a46-fc76b9ff0347 (e2ejourney.test.portlama.local)  
✅ `18:43:34` Added DNS entries to agent /etc/hosts  
✅ `18:43:34` Added e2ejourney.test.portlama.local to visitor /etc/hosts  
✅ `18:43:37` HTTP server running on agent at port 18090  
ℹ️ `18:43:37` Waiting for Chisel tunnel to establish...  
✅ `18:43:37` Chisel tunnel established (port 18090 accessible on host)  

## Step 2: Prepare TOTP for test user

✅ `18:43:37` oathtool is available on visitor VM  
✅ `18:43:37` TOTP reset returned otpauth URI  
✅ `18:43:37` Extracted TOTP secret from otpauth URI  
✅ `18:43:39` oathtool generates valid TOTP codes for this secret  

## Step 3: Unauthenticated access redirects to Authelia (from visitor VM)

✅ `18:43:39` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:43:39` Redirect URL contains auth.test.portlama.local  
✅ `18:43:39` Tunnel content is NOT visible without authentication  

## Step 4: First factor authentication from visitor VM (username/password)

✅ `18:43:41` First factor authentication succeeded (username/password accepted)  

## Step 5: Second factor authentication from visitor VM (TOTP)

ℹ️ `18:43:41` Generated TOTP code: 054985  
✅ `18:43:41` Second factor authentication succeeded (TOTP accepted)  

## Step 6: Authenticated access from visitor VM shows tunnel content

✅ `18:43:41` Authenticated request returns tunnel content (full 2FA path verified)  
✅ `18:43:41` Authenticated request returns HTTP 200  

## Step 7: Session persistence (no re-auth needed, from visitor VM)

✅ `18:43:41` Session persists — second request returns tunnel content without re-auth  
✅ `18:43:41` Session persists — HTTP 200 on second request  

## Step 8: Invalid session redirects to Authelia again (from visitor VM)

✅ `18:43:42` Invalid/expired session rejected (HTTP 302)  
✅ `18:43:42` Invalid session does not expose tunnel content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `18:43:42` Cleaning up test resources...  
🔵 `18:43:45` **Running: 07-site-visitor-journey.sh**  
