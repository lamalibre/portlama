# Portlama E2E: 19 — Panel Expose Lifecycle

> Started at `2026-03-29 07:36:20 UTC`


## Pre-flight: check onboarding is complete


## Verify panel:expose is a valid capability

✅ `07:36:22` Agent cert with panel:expose created successfully  
✅ `07:36:22` Agent cert has a p12 password  
ℹ️ `07:36:22` Created agent cert: panel-e2e-1774769780  
✅ `07:36:22` Extracted PEM cert and key from .p12  

## Expose panel: check agent-panel-status before expose

✅ `07:36:22` Panel not exposed initially  
✅ `07:36:22` No FQDN before expose  

## Expose panel: POST /api/tunnels/expose-panel

✅ `07:36:24` Expose panel returned ok: true  
✅ `07:36:24` Panel tunnel has an ID  
✅ `07:36:24` Panel tunnel type is 'panel'  
✅ `07:36:24` Panel subdomain matches agent-<label>  
✅ `07:36:24` Panel tunnel port matches  
✅ `07:36:24` Panel tunnel has an FQDN  
✅ `07:36:24` Panel tunnel has a createdAt timestamp  
✅ `07:36:24` Panel tunnel agentLabel matches  
ℹ️ `07:36:24` Exposed panel tunnel: agent-panel-e2e-1774769780.test.portlama.local (ID: e0774ebe-ed5d-4a5f-b91c-ee962d9ffaa9)  

## Verify panel tunnel in tunnel listing

✅ `07:36:24` Panel tunnel shows type 'panel' in listing  
✅ `07:36:24` Panel tunnel shows correct agentLabel in listing  

## Verify nginx mTLS vhost created (not app vhost)

✅ `07:36:24` mTLS panel vhost exists at /etc/nginx/sites-enabled/portlama-agent-panel-agent-panel-e2e-1774769780  
✅ `07:36:24` No app vhost created (correct — panel uses mTLS vhost)  
✅ `07:36:24` nginx -t passes after panel expose  

## Verify agent-panel-status after expose

✅ `07:36:24` Panel shows as enabled after expose  
✅ `07:36:24` Panel status FQDN matches  
✅ `07:36:24` Panel status port matches  

## Duplicate expose returns 409

✅ `07:36:24` Duplicate panel expose returns 409 Conflict  

## Validation: agent- prefix reserved for non-panel tunnels

✅ `07:36:24` agent- prefix rejected for non-panel tunnel (HTTP 400)  

## Capability check: agent without panel:expose gets 403

✅ `07:36:25` Agent cert without panel:expose created  
✅ `07:36:25` Expose panel returns 403 without panel:expose capability  
✅ `07:36:25` Agent panel status returns 403 without panel:expose capability  
✅ `07:36:25` Retract panel returns 403 without panel:expose capability  

## Capability check: PATCH panel tunnel requires panel:expose

✅ `07:36:25` PATCH panel tunnel returns 403 without panel:expose  

## Capability check: DELETE panel tunnel requires panel:expose

✅ `07:36:25` DELETE panel tunnel returns 403 without panel:expose  

## Cross-agent spoofing: generic POST /api/tunnels with type=panel

✅ `07:36:25` Cross-agent panel tunnel spoofing rejected (HTTP 403)  

## Retract panel: DELETE /api/tunnels/retract-panel

✅ `07:36:28` Retract panel returned ok: true  
✅ `07:36:28` Panel tunnel no longer in list after retract  
✅ `07:36:28` mTLS panel vhost removed after retract  
✅ `07:36:28` nginx -t passes after panel retract  

## Verify agent-panel-status after retract

✅ `07:36:28` Panel shows as disabled after retract  

## Retract nonexistent panel returns 404

✅ `07:36:28` Retract nonexistent panel returns 404  

## Validation: expose-panel with invalid port

✅ `07:36:28` Port below 1024 rejected (HTTP 400)  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `37` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `37` |

ℹ️ `07:36:28` Cleaning up test resources...  
