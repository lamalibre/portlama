# Portlama E2E: 11 — Input Validation & Security Hardening

> Started at `2026-03-29 07:35:45 UTC`


## Pre-flight: check onboarding is complete


## Invalid UUID for tunnel operations

✅ `07:35:45` PATCH /api/tunnels/not-a-uuid returns 400  
✅ `07:35:45` DELETE /api/tunnels/not-a-uuid returns 400  
✅ `07:35:46` PATCH /api/tunnels/../etc/passwd rejected (HTTP 404)  

## Invalid UUID for site operations

✅ `07:35:46` DELETE /api/sites/not-a-uuid returns 400  

## Invalid invite token format

✅ `07:35:46` GET /api/invite/not-a-valid-token returns 400  
✅ `07:35:46` POST /api/invite/not-a-valid-token/accept returns 400  
✅ `07:35:46` Path traversal does not expose /etc/passwd  

## Invalid domain format in certs endpoint

✅ `07:35:46` POST /api/certs/a..b/renew returns 400  
✅ `07:35:46` POST /api/certs/.../renew returns 400  
✅ `07:35:46` POST /api/certs/evil.com;inject/renew returns 400  

## Subdomain injection attempts

✅ `07:35:46` Subdomain with semicolon rejected (HTTP 400)  
✅ `07:35:46` Subdomain with newline rejected (HTTP 400)  
✅ `07:35:46` Subdomain with path traversal rejected (HTTP 400)  
✅ `07:35:46` Subdomain with uppercase rejected (HTTP 400)  
✅ `07:35:46` Subdomain with 64 chars rejected (HTTP 400)  

## Port boundary validation

✅ `07:35:46` Port 0 rejected (HTTP 400)  
✅ `07:35:46` Port 1023 rejected (HTTP 400)  
✅ `07:35:46` Port 65536 rejected (HTTP 400)  
✅ `07:35:46` Port -1 rejected (HTTP 400)  
✅ `07:35:46` Port 'abc' (string) rejected (HTTP 400)  

## Malformed JSON bodies

✅ `07:35:46` Invalid JSON body to /api/tunnels returns 400  
✅ `07:35:46` Empty body to /api/users rejected (HTTP 400)  

## File permissions

✅ `07:35:46` /etc/portlama/tunnels.json has correct permissions (600)  
⏭️ `07:35:46` /etc/portlama/sites.json not found  
✅ `07:35:46` panel.json has correct permissions (640)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `24` |
| **Failed** | `0` |
| **Skipped** | `1` |
| **Total** | `25` |

