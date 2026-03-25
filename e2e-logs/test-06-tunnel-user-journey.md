# Portlama E2E: 06 — Tunnel User Journey (Three-VM)

> Started at `2026-03-25 09:23:34 UTC`


## Pre-flight: verify onboarding is complete


## Step 1: Create tunnel and establish connection

✅ `09:23:37` Tunnel creation returned ok: true  
✅ `09:23:37` Tunnel has an ID  
ℹ️ `09:23:37` Created tunnel ID: 677ce91e-78a1-4b17-91fc-77536d303170 (e2ejourney.test.portlama.local)  
✅ `09:23:37` Added DNS entries to agent /etc/hosts  
✅ `09:23:37` Added e2ejourney.test.portlama.local to visitor /etc/hosts  
✅ `09:23:40` HTTP server running on agent at port 18090  
ℹ️ `09:23:45` Waiting for Chisel tunnel to establish...  
✅ `09:23:45` Chisel tunnel established (port 18090 accessible on host)  

## Step 2: Prepare TOTP for test user

✅ `09:23:46` oathtool is available on visitor VM  
✅ `09:23:46` TOTP reset returned otpauth URI  
✅ `09:23:46` Extracted TOTP secret from otpauth URI  
✅ `09:23:48` oathtool generates valid TOTP codes for this secret  

## Step 3: Unauthenticated access redirects to Authelia (from visitor VM)

✅ `09:23:48` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `09:23:48` Redirect URL contains auth.test.portlama.local  
✅ `09:23:48` Tunnel content is NOT visible without authentication  

## Step 4: First factor authentication from visitor VM (username/password)

✅ `09:23:49` First factor authentication succeeded (username/password accepted)  

## Step 5: Second factor authentication from visitor VM (TOTP)

ℹ️ `09:23:49` Generated TOTP code: 801277  
✅ `09:23:49` Second factor authentication succeeded (TOTP accepted)  

## Step 6: Authenticated access from visitor VM shows tunnel content

✅ `09:23:49` Authenticated request returns tunnel content (full 2FA path verified)  
✅ `09:23:50` Authenticated request returns HTTP 200  

## Step 7: Session persistence (no re-auth needed, from visitor VM)

✅ `09:23:50` Session persists — second request returns tunnel content without re-auth  
✅ `09:23:50` Session persists — HTTP 200 on second request  

## Step 8: Invalid session redirects to Authelia again (from visitor VM)

✅ `09:23:50` Invalid/expired session rejected (HTTP 302)  
✅ `09:23:50` Invalid session does not expose tunnel content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `09:23:50` Cleaning up test resources...  
🔵 `09:23:56` **Running: 07-site-visitor-journey.sh**  
