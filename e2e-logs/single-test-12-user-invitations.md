# Portlama E2E: 12 — User Invitations

> Started at `2026-03-29 07:35:46 UTC`


## Pre-flight: check onboarding is complete


## Create invitation

✅ `07:35:46` Invitation creation returned ok: true  
✅ `07:35:46` Invitation username matches  
✅ `07:35:46` Invitation email matches  
✅ `07:35:46` Invitation token is valid 64-char hex  
✅ `07:35:46` Invitation ID is present  
✅ `07:35:46` Invitation createdAt is present  
✅ `07:35:46` Invitation expiresAt is present  

## List invitations

✅ `07:35:46` Invitation appears in GET /api/invitations  
✅ `07:35:46` Token is not exposed in invitation list  
✅ `07:35:46` Invitation status is pending  

## Duplicate invitation

✅ `07:35:46` Duplicate invitation for same username rejected (HTTP 409)  

## Validation: invalid input

✅ `07:35:46` Incomplete invitation data rejected (HTTP 400)  
✅ `07:35:46` Invalid email rejected (HTTP 400)  

## Get invitation details (public endpoint)

✅ `07:35:46` Public invite details show username  
✅ `07:35:46` Public invite details show email  
✅ `07:35:46` Public invite details show expiresAt  

## Invalid token

✅ `07:35:46` Accept with invalid token returns 404  
✅ `07:35:46` Malformed token rejected (HTTP 400)  

## Accept invitation (public endpoint)

✅ `07:35:48` Invitation acceptance returned ok: true  
✅ `07:35:48` Accepted username matches  

## Verify invited user exists

✅ `07:35:48` Invited user appears in GET /api/users  
✅ `07:35:48` Invited user email matches  

## Invitation marked as accepted

✅ `07:35:48` Invitation status changed to accepted  

## Used token rejection

✅ `07:35:48` Reusing accepted token returns 410 Gone  
✅ `07:35:48` GET on used token returns 410 Gone  

## Accept with short password

✅ `07:35:48` Short password rejected on invite accept (HTTP 400)  

## Cleanup: delete invited user

✅ `07:35:51` Invited user deletion returned ok: true  
✅ `07:35:51` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `28` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `28` |

