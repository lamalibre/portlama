# Portlama E2E: 06 — Tunnel User Journey (Three-VM)

> Started at `2026-03-25 18:06:12 UTC`


## Pre-flight: verify onboarding is complete


## Step 1: Create tunnel and establish connection

✅ `18:06:15` Tunnel creation returned ok: true  
✅ `18:06:15` Tunnel has an ID  
ℹ️ `18:06:15` Created tunnel ID: bdec6642-739c-471a-9e6b-672019645677 (e2ejourney.test.portlama.local)  
✅ `18:06:15` Added DNS entries to agent /etc/hosts  
✅ `18:06:15` Added e2ejourney.test.portlama.local to visitor /etc/hosts  
✅ `18:06:18` HTTP server running on agent at port 18090  
ℹ️ `18:06:22` Waiting for Chisel tunnel to establish...  
✅ `18:06:23` Chisel tunnel established (port 18090 accessible on host)  

## Step 2: Prepare TOTP for test user

✅ `18:06:23` oathtool is available on visitor VM  
✅ `18:06:23` TOTP reset returned otpauth URI  
✅ `18:06:23` Extracted TOTP secret from otpauth URI  
✅ `18:06:25` oathtool generates valid TOTP codes for this secret  

## Step 3: Unauthenticated access redirects to Authelia (from visitor VM)

✅ `18:06:25` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `18:06:25` Redirect URL contains auth.test.portlama.local  
✅ `18:06:25` Tunnel content is NOT visible without authentication  

## Step 4: First factor authentication from visitor VM (username/password)

✅ `18:06:27` First factor authentication succeeded (username/password accepted)  

## Step 5: Second factor authentication from visitor VM (TOTP)

ℹ️ `18:06:27` Generated TOTP code: 803506  
✅ `18:06:27` Second factor authentication succeeded (TOTP accepted)  

## Step 6: Authenticated access from visitor VM shows tunnel content

✅ `18:06:27` Authenticated request returns tunnel content (full 2FA path verified)  
✅ `18:06:27` Authenticated request returns HTTP 200  

## Step 7: Session persistence (no re-auth needed, from visitor VM)

✅ `18:06:27` Session persists — second request returns tunnel content without re-auth  
✅ `18:06:27` Session persists — HTTP 200 on second request  

## Step 8: Invalid session redirects to Authelia again (from visitor VM)

✅ `18:06:28` Invalid/expired session rejected (HTTP 302)  
✅ `18:06:28` Invalid session does not expose tunnel content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `18:06:28` Cleaning up test resources...  
🔵 `18:06:34` **Running: 07-site-visitor-journey.sh**  
