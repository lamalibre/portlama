# Portlama E2E: 13 — Site Lifecycle

> Started at `2026-03-29 07:35:51 UTC`


## Pre-flight: check onboarding is complete

✅ `07:35:51` Onboarding is complete  

## Create managed static site

✅ `07:35:51` Site creation returned ok: true  
✅ `07:35:51` Site has an ID  
✅ `07:35:51` Site name matches  
✅ `07:35:51` Site type is managed  
ℹ️ `07:35:51` Created site: e2esite.test.portlama.local (ID: 602c4242-3446-4697-9120-3fed10f49c40)  

## Verify site in listing

✅ `07:35:51` Site appears in listing  

## List files — default content

✅ `07:35:51` Site has default files (count: 1)  
✅ `07:35:51` Default index.html exists  

## Upload test file

✅ `07:35:51` File upload returned ok: true  

## Verify uploaded file in listing

✅ `07:35:51` Uploaded file appears in listing  

## Delete uploaded file

✅ `07:35:51` File deletion returned ok: true  

## Verify file removed

✅ `07:35:51` Deleted file no longer in listing  

## Update site settings

✅ `07:35:51` Settings update returned ok: true  
✅ `07:35:51` SPA mode is now enabled  
✅ `07:35:51` SPA mode persisted in listing  

## File extension validation

✅ `07:35:51` Upload of .php file rejected with 400  
✅ `07:35:51` Upload of .exe file rejected with 400  
✅ `07:35:51` Upload of file with no extension rejected with 400  
✅ `07:35:51` Upload of .css file succeeds  

## Input validation

✅ `07:35:51` Duplicate site name rejected with 400  
✅ `07:35:51` Reserved name 'panel' rejected with 400  
✅ `07:35:51` Reserved name 'auth' rejected with 400  
✅ `07:35:51` Invalid UUID rejected with 400  

## Delete site

✅ `07:35:52` Site deletion returned ok: true  

## Verify site removed

✅ `07:35:52` Deleted site no longer in listing  
✅ `07:35:52` Deleted site returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `26` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `26` |

