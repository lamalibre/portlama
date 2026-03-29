# Portlama E2E: 09 — Agent Site Deploy (Three-VM)

> Started at `2026-03-29 07:39:23 UTC`


## Pre-flight: verify onboarding is complete


## Create managed site using admin cert

✅ `07:39:24` Site creation via admin cert returned ok: true  
✅ `07:39:24` Site has an ID  
✅ `07:39:24` Site has an FQDN  
ℹ️ `07:39:24` Created site: e2esite.test.portlama.local (ID: 09a217a2-47c4-4964-b06b-3d755e707d3a)  

## Generate agent cert with sites capabilities and allowedSites

✅ `07:39:27` Agent cert creation returned ok: true  
✅ `07:39:27` Agent cert has a p12 password  
✅ `07:39:27` Agent cert label matches  
ℹ️ `07:39:27` Created agent cert: site-agent (allowedSites: [e2esite])  
✅ `07:39:27` Extracted PEM cert and key from .p12  

## Upload test HTML file using agent cert

✅ `07:39:27` File upload via agent cert returned ok: true  

## Verify site listing using agent cert (sites:read + allowedSites)

✅ `07:39:27` Agent can list sites and find assigned site  
✅ `07:39:27` Agent sees only its assigned site (count: 1)  

## Verify site accessible from visitor VM

✅ `07:39:30` Site returns HTTP 200 from visitor VM  
✅ `07:39:30` Site content matches uploaded HTML from visitor VM  

## File extension validation — disallowed extensions rejected

✅ `07:39:30` Upload of .php file rejected with 400  
✅ `07:39:30` Upload of .exe file rejected with 400  
✅ `07:39:30` Upload of .css file succeeds via agent cert  

## Delete site using admin cert (site CRUD is admin-only)

✅ `07:39:31` Site deletion via admin cert returned ok: true  
✅ `07:39:31` Deleted site no longer in listing  

## Negative test: agent WITHOUT site in allowedSites gets 403 on file upload

✅ `07:39:33` No-perm agent cert creation returned ok: true  
✅ `07:39:33` Agent without site in allowedSites rejected with 403 on file upload  
✅ `07:39:33` Agent sees only assigned sites (none match real sites)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `20` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `20` |

ℹ️ `07:39:33` Cleaning up test resources...  
🔵 `07:39:34` **Running: 11-plugin-lifecycle.sh**  
