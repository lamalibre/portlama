# Portlama E2E: 06 — Tunnel User Journey (Three-VM)

> Started at `2026-03-29 07:38:26 UTC`


## Pre-flight: verify onboarding is complete


## Step 1: Create tunnel and establish connection

✅ `07:38:29` Tunnel creation returned ok: true  
✅ `07:38:29` Tunnel has an ID  
ℹ️ `07:38:29` Created tunnel ID: c79d9805-ab9b-402b-8e3e-cfb9b6c2b3e5 (e2ejourney.test.portlama.local)  
✅ `07:38:29` Added DNS entries to agent /etc/hosts  
✅ `07:38:29` Added e2ejourney.test.portlama.local to visitor /etc/hosts  
✅ `07:38:31` HTTP server running on agent at port 18090  
ℹ️ `07:38:36` Waiting for Chisel tunnel to establish...  
✅ `07:38:37` Chisel tunnel established (port 18090 accessible on host)  

## Step 2: Prepare TOTP for test user

✅ `07:38:37` oathtool is available on visitor VM  
✅ `07:38:37` TOTP reset returned otpauth URI  
✅ `07:38:37` Extracted TOTP secret from otpauth URI  
✅ `07:38:39` oathtool generates valid TOTP codes for this secret  

## Step 3: Unauthenticated access redirects to Authelia (from visitor VM)

✅ `07:38:39` Unauthenticated request redirected/rejected (HTTP 302)  
✅ `07:38:39` Redirect URL contains auth.test.portlama.local  
✅ `07:38:39` Tunnel content is NOT visible without authentication  

## Step 4: First factor authentication from visitor VM (username/password)

✅ `07:38:41` First factor authentication succeeded (username/password accepted)  

## Step 5: Second factor authentication from visitor VM (TOTP)

ℹ️ `07:38:41` Generated TOTP code: 873894  
✅ `07:38:41` Second factor authentication succeeded (TOTP accepted)  

## Step 6: Authenticated access from visitor VM shows tunnel content

✅ `07:38:41` Authenticated request returns tunnel content (full 2FA path verified)  
✅ `07:38:41` Authenticated request returns HTTP 200  

## Step 7: Session persistence (no re-auth needed, from visitor VM)

✅ `07:38:41` Session persists — second request returns tunnel content without re-auth  
✅ `07:38:41` Session persists — HTTP 200 on second request  

## Step 8: Invalid session redirects to Authelia again (from visitor VM)

✅ `07:38:41` Invalid/expired session rejected (HTTP 302)  
✅ `07:38:41` Invalid session does not expose tunnel content  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `21` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `21` |

ℹ️ `07:38:41` Cleaning up test resources...  
🔵 `07:38:47` **Running: 07-site-visitor-journey.sh**  
