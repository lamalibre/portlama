# Portlama E2E: 13 — Site Lifecycle

> Started at `2026-03-25 18:03:22 UTC`


## Pre-flight: check onboarding is complete

✅ `18:03:22` Onboarding is complete  

## Create managed static site

✅ `18:03:23` Site creation returned ok: true  
✅ `18:03:23` Site has an ID  
✅ `18:03:23` Site name matches  
✅ `18:03:23` Site type is managed  
ℹ️ `18:03:23` Created site: e2esite.test.portlama.local (ID: 88e6afca-8fbe-454f-8d14-40d940b85ab6)  

## Verify site in listing

✅ `18:03:23` Site appears in listing  

## List files — default content

✅ `18:03:23` Site has default files (count: 1)  
✅ `18:03:23` Default index.html exists  

## Upload test file

✅ `18:03:23` File upload returned ok: true  

## Verify uploaded file in listing

✅ `18:03:23` Uploaded file appears in listing  

## Delete uploaded file

✅ `18:03:23` File deletion returned ok: true  

## Verify file removed

✅ `18:03:23` Deleted file no longer in listing  

## Update site settings

✅ `18:03:23` Settings update returned ok: true  
✅ `18:03:23` SPA mode is now enabled  
✅ `18:03:23` SPA mode persisted in listing  

## File extension validation

✅ `18:03:23` Upload of .php file rejected with 400  
✅ `18:03:23` Upload of .exe file rejected with 400  
✅ `18:03:23` Upload of file with no extension rejected with 400  
✅ `18:03:23` Upload of .css file succeeds  

## Input validation

✅ `18:03:23` Duplicate site name rejected with 400  
✅ `18:03:23` Reserved name 'panel' rejected with 400  
✅ `18:03:23` Reserved name 'auth' rejected with 400  
✅ `18:03:23` Invalid UUID rejected with 400  

## Delete site

✅ `18:03:23` Site deletion returned ok: true  

## Verify site removed

✅ `18:03:23` Deleted site no longer in listing  
✅ `18:03:23` Deleted site returns 404  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `26` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `26` |

