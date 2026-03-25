# Portlama E2E: 12 — User Invitations

> Started at `2026-03-25 09:21:27 UTC`


## Pre-flight: check onboarding is complete


## Create invitation

✅ `09:21:27` Invitation creation returned ok: true  
✅ `09:21:27` Invitation username matches  
✅ `09:21:27` Invitation email matches  
✅ `09:21:27` Invitation token is valid 64-char hex  
✅ `09:21:27` Invitation ID is present  
✅ `09:21:27` Invitation createdAt is present  
✅ `09:21:27` Invitation expiresAt is present  

## List invitations

✅ `09:21:27` Invitation appears in GET /api/invitations  
✅ `09:21:27` Token is not exposed in invitation list  
✅ `09:21:27` Invitation status is pending  

## Duplicate invitation

✅ `09:21:27` Duplicate invitation for same username rejected (HTTP 409)  

## Validation: invalid input

✅ `09:21:27` Incomplete invitation data rejected (HTTP 400)  
✅ `09:21:27` Invalid email rejected (HTTP 400)  

## Get invitation details (public endpoint)

✅ `09:21:27` Public invite details show username  
✅ `09:21:27` Public invite details show email  
✅ `09:21:27` Public invite details show expiresAt  

## Invalid token

✅ `09:21:27` Accept with invalid token returns 404  
✅ `09:21:27` Malformed token rejected (HTTP 400)  

## Accept invitation (public endpoint)

✅ `09:21:30` Invitation acceptance returned ok: true  
✅ `09:21:30` Accepted username matches  

## Verify invited user exists

✅ `09:21:30` Invited user appears in GET /api/users  
✅ `09:21:30` Invited user email matches  

## Invitation marked as accepted

✅ `09:21:30` Invitation status changed to accepted  

## Used token rejection

✅ `09:21:30` Reusing accepted token returns 410 Gone  
✅ `09:21:30` GET on used token returns 410 Gone  

## Accept with short password

✅ `09:21:30` Short password rejected on invite accept (HTTP 400)  

## Cleanup: delete invited user

✅ `09:21:32` Invited user deletion returned ok: true  
✅ `09:21:32` Invited user no longer in list after deletion  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `28` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `28` |

