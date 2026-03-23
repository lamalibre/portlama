# Portlama E2E: 09 — Agent Site Deploy (Three-VM)

> Started at `2026-03-23 18:44:23 UTC`


## Pre-flight: verify onboarding is complete


## Create managed site using admin cert

✅ `18:44:24` Site creation via admin cert returned ok: true  
✅ `18:44:24` Site has an ID  
✅ `18:44:24` Site has an FQDN  
ℹ️ `18:44:24` Created site: e2esite.test.portlama.local (ID: 98e6734d-b11e-4ce8-a3ef-d03fccd8d179)  

## Generate agent cert with sites capabilities and allowedSites

✅ `18:44:25` Agent cert creation returned ok: true  
✅ `18:44:25` Agent cert has a p12 password  
✅ `18:44:25` Agent cert label matches  
ℹ️ `18:44:25` Created agent cert: site-agent (allowedSites: [e2esite])  
✅ `18:44:25` Extracted PEM cert and key from .p12  

## Upload test HTML file using agent cert

✅ `18:44:25` File upload via agent cert returned ok: true  

## Verify site listing using agent cert (sites:read + allowedSites)

✅ `18:44:26` Agent can list sites and find assigned site  
✅ `18:44:26` Agent sees only its assigned site (count: 1)  

## Verify site accessible from visitor VM

✅ `18:44:28` Site returns HTTP 200 from visitor VM  
✅ `18:44:28` Site content matches uploaded HTML from visitor VM  

## File extension validation — disallowed extensions rejected

✅ `18:44:28` Upload of .php file rejected with 400  
✅ `18:44:28` Upload of .exe file rejected with 400  
✅ `18:44:28` Upload of .css file succeeds via agent cert  

## Delete site using admin cert (site CRUD is admin-only)

✅ `18:44:29` Site deletion via admin cert returned ok: true  
✅ `18:44:29` Deleted site no longer in listing  

## Negative test: agent WITHOUT site in allowedSites gets 403 on file upload

✅ `18:44:32` No-perm agent cert creation returned ok: true  
✅ `18:44:32` Agent without site in allowedSites rejected with 403 on file upload  
✅ `18:44:33` Agent sees only assigned sites (none match real sites)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

ℹ️ `18:44:33` Cleaning up test resources...  
🔵 `18:44:33` **Running: 10-shell-lifecycle.sh**  
