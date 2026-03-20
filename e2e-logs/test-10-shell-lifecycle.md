# Portlama E2E: 10 — Shell Lifecycle (Three-VM)

> Started at `2026-03-20 11:06:43 UTC`


## Pre-flight: verify onboarding is complete

✅ `11:06:43` Onboarding is complete  

## 1. Shell config defaults

✅ `11:06:43` Shell disabled by default  
✅ `11:06:44` At least one default policy exists  
✅ `11:06:44` Default policy ID is 'default'  

## 2. Enable shell globally

✅ `11:06:44` Enable shell returned ok: true  
✅ `11:06:44` Shell is now enabled  

## 3. Policy CRUD

✅ `11:06:44` Policy creation returned ok: true  
✅ `11:06:44` Policy has an ID  
ℹ️ `11:06:44` Created policy: e2e-test-policy  
✅ `11:06:44` Created policy found in listing  
✅ `11:06:44` Policy update returned ok: true  
✅ `11:06:44` Policy timeout updated to 600  
✅ `11:06:44` Cannot delete default policy (400)  
✅ `11:06:44` Policy deletion returned ok: true  
✅ `11:06:44` Deleted policy no longer in listing  

## 4. Policy validation

✅ `11:06:44` Empty policy name rejected with 400  
✅ `11:06:45` Invalid CIDR /99 rejected with 400  
✅ `11:06:45` Policy name > 100 chars rejected with 400  

## 5. REST API: enable/disable shell for agent cert

✅ `11:06:46` Agent cert creation returned ok: true  
✅ `11:06:46` Extracted agent PEM cert and key  
✅ `11:06:46` Shell enable for agent returned ok: true  
✅ `11:06:46` shellEnabledUntil is set  
ℹ️ `11:06:46` Shell enabled for agent e2e-shell-agent  
✅ `11:06:46` Agent sees global shell enabled  
✅ `11:06:46` Agent sees own shell enabled  
✅ `11:06:46` Agent-status returns correct label  
✅ `11:06:47` Agent sees shellEnabledUntil  
✅ `11:06:47` Shell disable for agent returned ok: true  
✅ `11:06:47` Agent sees shell disabled after disable  
✅ `11:06:47` Shell enable rejected when globally disabled (400)  

## 6. Install portlama-agent on VMs for integration test

ℹ️ `11:06:47` Packing portlama-agent tarball...  
✅ `11:06:47` portlama-agent tarball packed: /tmp/lamalibre-portlama-agent-1.0.3.tgz  
ℹ️ `11:06:47` Installing portlama-agent on agent VM...  
✅ `11:07:50` portlama-agent installed on agent VM  
✅ `11:07:50` tmux installed on agent VM  
ℹ️ `11:07:50` Installing portlama-agent on host VM...  
✅ `11:07:56` portlama-agent installed on host VM  

## 7. Configure and start shell-server on agent VM

✅ `11:07:56` Agent config written to /root/.portlama/agent.json  
✅ `11:07:56` Shell enabled for test-agent  
ℹ️ `11:07:56` Shell-server started on agent VM (PID: 10653)  
✅ `11:07:58` Shell-server connected to panel relay  

## 8. Full integration: admin connects and executes a command

✅ `11:07:58` Admin P12 created on host VM  
✅ `11:07:58` Test client script written to host VM  
ℹ️ `11:07:58` Session count before integration test: 0  
ℹ️ `11:07:58` Running WebSocket shell test client on host VM...  
ℹ️ `11:08:01` WebSocket test output:  
ℹ️ `11:08:01`   Connecting to: wss://127.0.0.1:9292/api/shell/connect/test-agent  
ℹ️ `11:08:01`   WebSocket connected to panel relay  
ℹ️ `11:08:01`   Received message type: connected  
ℹ️ `11:08:01`   Agent connected, relay active  
ℹ️ `11:08:01`   Received message type: session-started  
ℹ️ `11:08:01`   Session started: 40e925b9-56df-4293-9446-66e1e7fe458e  
ℹ️ `11:08:01`   Received message type: output  
ℹ️ `11:08:01`   Sending test command...  
ℹ️ `11:08:01`   Received message type: output  
ℹ️ `11:08:01`   Received message type: output  
ℹ️ `11:08:01`   SUCCESS: Marker found in shell output  
ℹ️ `11:08:01`   Test passed — shell session completed successfully  
✅ `11:08:01` Full integration: admin connected, executed command, verified output  

## 9. Verify session audit log

✅ `11:08:03` New session entry created in audit log (before: 0, after: 1)  
✅ `11:08:03` Latest session belongs to agent: test-agent  
ℹ️ `11:08:03` Shell-server stopped on agent VM  

## 10. File transfer endpoints (501)

✅ `11:08:03` File download returns 501 (not yet implemented)  
✅ `11:08:04` File upload without path returns 400  

## 11. Input validation

✅ `11:08:04` Non-existent default policy rejected (400)  
✅ `11:08:04` durationMinutes=0 rejected (400)  
✅ `11:08:04` durationMinutes=9999 rejected (400)  
✅ `11:08:04` Shell enable for non-existent agent (404)  
✅ `11:08:04` Invalid label format rejected (400)  

## 12. Cleanup

✅ `11:08:04` Shell disabled after cleanup  
ℹ️ `11:08:04` Shell test cleanup complete  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `48` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `48` |

ℹ️ `11:08:04` Cleaning up shell test resources...  
