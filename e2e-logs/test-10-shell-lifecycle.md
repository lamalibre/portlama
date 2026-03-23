# Portlama E2E: 10 — Shell Lifecycle (Three-VM)

> Started at `2026-03-23 18:44:36 UTC`


## Pre-flight: verify onboarding is complete

✅ `18:44:37` Onboarding is complete  

## 1. Shell config defaults

✅ `18:44:37` Shell disabled by default  
✅ `18:44:37` At least one default policy exists  
✅ `18:44:37` Default policy ID is 'default'  

## 2. Enable shell globally

✅ `18:44:37` Enable shell returned ok: true  
✅ `18:44:37` Shell is now enabled  

## 3. Policy CRUD

✅ `18:44:37` Policy creation returned ok: true  
✅ `18:44:37` Policy has an ID  
ℹ️ `18:44:37` Created policy: e2e-test-policy  
✅ `18:44:37` Created policy found in listing  
✅ `18:44:37` Policy update returned ok: true  
✅ `18:44:37` Policy timeout updated to 600  
✅ `18:44:37` Cannot delete default policy (400)  
✅ `18:44:37` Policy deletion returned ok: true  
✅ `18:44:38` Deleted policy no longer in listing  

## 4. Policy validation

✅ `18:44:38` Empty policy name rejected with 400  
✅ `18:44:38` Invalid CIDR /99 rejected with 400  
✅ `18:44:38` Policy name > 100 chars rejected with 400  

## 5. REST API: enable/disable shell for agent cert

✅ `18:44:39` Agent cert creation returned ok: true  
✅ `18:44:39` Extracted agent PEM cert and key  
✅ `18:44:39` Shell enable for agent returned ok: true  
✅ `18:44:39` shellEnabledUntil is set  
ℹ️ `18:44:39` Shell enabled for agent e2e-shell-agent  
✅ `18:44:39` Agent sees global shell enabled  
✅ `18:44:39` Agent sees own shell enabled  
✅ `18:44:39` Agent-status returns correct label  
✅ `18:44:39` Agent sees shellEnabledUntil  
✅ `18:44:39` Shell disable for agent returned ok: true  
✅ `18:44:39` Agent sees shell disabled after disable  
✅ `18:44:39` Shell enable rejected when globally disabled (400)  

## 6. Install portlama-agent on VMs for integration test

ℹ️ `18:44:40` Packing portlama-agent tarball...  
✅ `18:44:40` portlama-agent tarball packed: /tmp/lamalibre-portlama-agent-1.0.6.tgz  
ℹ️ `18:44:40` Installing portlama-agent on agent VM...  
✅ `18:45:39` portlama-agent installed on agent VM  
✅ `18:45:39` tmux installed on agent VM  
ℹ️ `18:45:39` Installing portlama-agent on host VM...  
✅ `18:45:45` portlama-agent installed on host VM  

## 7. Configure and start shell-server on agent VM

✅ `18:45:45` Agent config written to /root/.portlama/agent.json  
✅ `18:45:45` Shell enabled for test-agent  
ℹ️ `18:45:45` Shell-server started on agent VM (PID: 10992)  
✅ `18:45:47` Shell-server connected to panel relay  

## 8. Full integration: admin connects and executes a command

✅ `18:45:47` Admin P12 created on host VM  
✅ `18:45:47` Test client script written to host VM  
ℹ️ `18:45:47` Session count before integration test: 0  
ℹ️ `18:45:47` Running WebSocket shell test client on host VM...  
ℹ️ `18:45:51` WebSocket test output:  
ℹ️ `18:45:51`   Connecting to: wss://127.0.0.1:9292/api/shell/connect/test-agent  
ℹ️ `18:45:51`   WebSocket connected to panel relay  
ℹ️ `18:45:51`   Received message type: connected  
ℹ️ `18:45:51`   Agent connected, relay active  
ℹ️ `18:45:51`   Received message type: session-started  
ℹ️ `18:45:51`   Session started: e7cc3184-22e2-4df3-a0d5-2752e29f6251  
ℹ️ `18:45:51`   Received message type: output  
ℹ️ `18:45:51`   Sending test command...  
ℹ️ `18:45:51`   Received message type: output  
ℹ️ `18:45:51`   Received message type: output  
ℹ️ `18:45:51`   SUCCESS: Marker found in shell output  
ℹ️ `18:45:51`   Test passed — shell session completed successfully  
✅ `18:45:51` Full integration: admin connected, executed command, verified output  

## 9. Verify session audit log

✅ `18:45:53` New session entry created in audit log (before: 0, after: 1)  
✅ `18:45:53` Latest session belongs to agent: test-agent  
ℹ️ `18:45:54` Shell-server stopped on agent VM  

## 10. File transfer endpoints (501)

✅ `18:45:54` File download returns 501 (not yet implemented)  
✅ `18:45:54` File upload without path returns 400  

## 11. Input validation

✅ `18:45:54` Non-existent default policy rejected (400)  
✅ `18:45:54` durationMinutes=0 rejected (400)  
✅ `18:45:54` durationMinutes=9999 rejected (400)  
✅ `18:45:54` Shell enable for non-existent agent (404)  
✅ `18:45:54` Invalid label format rejected (400)  

## 12. Cleanup

✅ `18:45:55` Shell disabled after cleanup  
ℹ️ `18:45:55` Shell test cleanup complete  

---

## Results

| Metric | Count |
|--------|-------|
| **Passed** | `48` |
| **Failed** | `0` |
| **Skipped** | `0` |
| **Total** | `48` |

ℹ️ `18:45:55` Cleaning up shell test resources...  
🔵 `18:45:55` **Running: 11-plugin-lifecycle.sh**  
