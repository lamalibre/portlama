# Portlama E2E: 12 — User Invitations

> Started at `2026-03-20 11:03:59 UTC`


## Pre-flight: check onboarding is complete


## Create invitation

✅ `11:03:59` Invitation creation returned ok: true  
✅ `11:03:59` Invitation username matches  
✅ `11:03:59` Invitation email matches  
✅ `11:03:59` Invitation token is valid 64-char hex  
✅ `11:03:59` Invitation ID is present  
✅ `11:03:59` Invitation createdAt is present  
✅ `11:03:59` Invitation expiresAt is present  

## List invitations

✅ `11:03:59` Invitation appears in GET /api/invitations  
✅ `11:03:59` Token is not exposed in invitation list  
✅ `11:03:59` Invitation status is pending  

## Duplicate invitation

✅ `11:03:59` Duplicate invitation for same username rejected (HTTP 409)  

## Validation: invalid input

✅ `11:03:59` Incomplete invitation data rejected (HTTP 400)  
✅ `11:03:59` Invalid email rejected (HTTP 400)  

## Get invitation details (public endpoint)

✅ `11:03:59` Public invite details show username  
✅ `11:03:59` Public invite details show email  
✅ `11:03:59` Public invite details show expiresAt  

## Invalid token

✅ `11:03:59` Accept with invalid token returns 404  
✅ `11:03:59` Malformed token rejected (HTTP 400)  

## Accept invitation (public endpoint)

✅ `11:04:02` Invitation acceptance returned ok: true  
✅ `11:04:02` Accepted username matches  

## Verify invited user exists

✅ `11:04:02` Invited user appears in GET /api/users  
✅ `11:04:02` Invited user email matches  

## Invitation marked as accepted

✅ `11:04:02` Invitation status changed to accepted  

## Used token rejection

✅ `11:04:02` Reusing accepted token returns 410 Gone  
✅ `11:04:02` GET on used token returns 410 Gone  

## Accept with short password

✅ `11:04:02` Short password rejected on invite accept (HTTP 400)  

## Cleanup: delete invited user

✅ `11:04:04` Invited user deletion returned ok: true  
✅ `11:04:04` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `28` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `28` |

