# Portlama E2E: 12 — User Invitations

> Started at `2026-03-23 18:41:38 UTC`


## Pre-flight: check onboarding is complete


## Create invitation

✅ `18:41:38` Invitation creation returned ok: true  
✅ `18:41:38` Invitation username matches  
✅ `18:41:38` Invitation email matches  
✅ `18:41:38` Invitation token is valid 64-char hex  
✅ `18:41:38` Invitation ID is present  
✅ `18:41:38` Invitation createdAt is present  
✅ `18:41:38` Invitation expiresAt is present  

## List invitations

✅ `18:41:38` Invitation appears in GET /api/invitations  
✅ `18:41:38` Token is not exposed in invitation list  
✅ `18:41:38` Invitation status is pending  

## Duplicate invitation

✅ `18:41:38` Duplicate invitation for same username rejected (HTTP 409)  

## Validation: invalid input

✅ `18:41:38` Incomplete invitation data rejected (HTTP 400)  
✅ `18:41:38` Invalid email rejected (HTTP 400)  

## Get invitation details (public endpoint)

✅ `18:41:38` Public invite details show username  
✅ `18:41:38` Public invite details show email  
✅ `18:41:38` Public invite details show expiresAt  

## Invalid token

✅ `18:41:38` Accept with invalid token returns 404  
✅ `18:41:38` Malformed token rejected (HTTP 400)  

## Accept invitation (public endpoint)

✅ `18:41:41` Invitation acceptance returned ok: true  
✅ `18:41:41` Accepted username matches  

## Verify invited user exists

✅ `18:41:41` Invited user appears in GET /api/users  
✅ `18:41:41` Invited user email matches  

## Invitation marked as accepted

✅ `18:41:41` Invitation status changed to accepted  

## Used token rejection

✅ `18:41:41` Reusing accepted token returns 410 Gone  
✅ `18:41:41` GET on used token returns 410 Gone  

## Accept with short password

✅ `18:41:41` Short password rejected on invite accept (HTTP 400)  

## Cleanup: delete invited user

✅ `18:41:43` Invited user deletion returned ok: true  
✅ `18:41:43` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `28` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `28` |

