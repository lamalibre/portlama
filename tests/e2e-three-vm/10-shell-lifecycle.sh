#!/usr/bin/env bash
# ============================================================================
# 10 — Shell Lifecycle (Three-VM)
# ============================================================================
# Verifies remote shell management endpoints and the full end-to-end shell
# session flow across three VMs:
#
# Sections 1-4:  REST API tests (config, policies, validation)
# Sections 5-9:  Full integration: install portlama-agent on both VMs,
#                start shell-server on agent VM, connect as admin via
#                WebSocket, execute a command, verify output, check audit log.
# Sections 10-12: Input validation + file transfer endpoints (501) + cleanup.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../e2e/helpers.sh"

require_commands multipass curl jq

# ---------------------------------------------------------------------------
# VM exec helpers
# ---------------------------------------------------------------------------

host_exec() { multipass exec portlama-host -- sudo bash -c "$1"; }
agent_exec() { multipass exec portlama-agent -- sudo bash -c "$1"; }

host_api_get() {
  host_exec "curl -skf --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -H 'Accept: application/json' https://127.0.0.1:9292/api/$1"
}

host_api_get_status() {
  host_exec "curl -sk -o /dev/null -w '%{http_code}' --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -H 'Accept: application/json' https://127.0.0.1:9292/api/$1" 2>/dev/null || echo "000"
}

host_api_post() {
  host_exec "curl -skf --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X POST -H 'Content-Type: application/json' -H 'Accept: application/json' -d '$2' https://127.0.0.1:9292/api/$1"
}

host_api_post_status() {
  host_exec "curl -sk -o /dev/null -w '%{http_code}' --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X POST -H 'Content-Type: application/json' -H 'Accept: application/json' -d '$2' https://127.0.0.1:9292/api/$1" 2>/dev/null || echo "000"
}

host_api_patch() {
  host_exec "curl -skf --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X PATCH -H 'Content-Type: application/json' -H 'Accept: application/json' -d '$2' https://127.0.0.1:9292/api/$1"
}

host_api_patch_status() {
  host_exec "curl -sk -o /dev/null -w '%{http_code}' --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X PATCH -H 'Content-Type: application/json' -H 'Accept: application/json' -d '$2' https://127.0.0.1:9292/api/$1" 2>/dev/null || echo "000"
}

host_api_delete() {
  host_exec "curl -skf --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X DELETE -H 'Accept: application/json' https://127.0.0.1:9292/api/$1"
}

host_api_delete_status() {
  host_exec "curl -sk -o /dev/null -w '%{http_code}' --max-time 30 --cert /etc/portlama/pki/client.crt --key /etc/portlama/pki/client.key --cacert /etc/portlama/pki/ca.crt -X DELETE -H 'Accept: application/json' https://127.0.0.1:9292/api/$1" 2>/dev/null || echo "000"
}

# Agent cert helpers
host_agent_api_get() {
  local cert_path="$1" key_path="$2" api_path="$3"
  host_exec "curl -skf --max-time 30 --cert ${cert_path} --key ${key_path} --cacert /etc/portlama/pki/ca.crt -H 'Accept: application/json' https://127.0.0.1:9292/api/${api_path}"
}

host_agent_api_get_status() {
  local cert_path="$1" key_path="$2" api_path="$3"
  host_exec "curl -sk -o /dev/null -w '%{http_code}' --max-time 30 --cert ${cert_path} --key ${key_path} --cacert /etc/portlama/pki/ca.crt -H 'Accept: application/json' https://127.0.0.1:9292/api/${api_path}" 2>/dev/null || echo "000"
}

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SHELL_AGENT_LABEL="e2e-shell-agent"
SHELL_AGENT_CERT_PATH=""
SHELL_AGENT_KEY_PATH=""
TEST_POLICY_ID=""

# The integration test uses the pre-existing test-agent cert from setup-host.sh
INTEGRATION_AGENT_LABEL="test-agent"

# Repo root — resolved from macOS (the test runner machine)
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

begin_test "10 — Shell Lifecycle (Three-VM)"

# ---------------------------------------------------------------------------
# Cleanup function — always runs on exit
# ---------------------------------------------------------------------------

cleanup() {
  log_info "Cleaning up shell test resources..."
  # Disable shell globally
  host_api_patch "shell/config" '{"enabled":false}' 2>/dev/null || true
  # Delete test policy if created
  if [ -n "$TEST_POLICY_ID" ] && [ "$TEST_POLICY_ID" != "null" ]; then
    host_api_delete "shell/policies/${TEST_POLICY_ID}" 2>/dev/null || true
  fi
  # Revoke the REST-test agent cert (not the integration test-agent)
  host_api_delete "certs/agent/${SHELL_AGENT_LABEL}" 2>/dev/null || true
  # Clean up PEM files
  host_exec "rm -f /tmp/e2e-shell-*.pem 2>/dev/null || true" 2>/dev/null || true
  # Kill shell-server on agent VM if still running
  agent_exec "pkill -f 'portlama-agent shell-server' 2>/dev/null || true" 2>/dev/null || true
  agent_exec "tmux kill-session -t portlama-shell 2>/dev/null || true" 2>/dev/null || true
  # Clean up admin P12 and agent.json on host VM
  host_exec "rm -f /tmp/admin.p12 /tmp/admin-agent.json /tmp/test-shell-client.mjs 2>/dev/null || true" 2>/dev/null || true
  # Clean up agent.json on agent VM
  agent_exec "rm -f /root/.portlama/agent.json 2>/dev/null || true" 2>/dev/null || true
  # Disable shell for integration agent
  host_api_delete "shell/enable/${INTEGRATION_AGENT_LABEL}" 2>/dev/null || true
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
log_section "Pre-flight: verify onboarding is complete"
# ---------------------------------------------------------------------------

ONBOARDING_STATUS=$(host_api_get "onboarding/status" | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$ONBOARDING_STATUS" != "COMPLETED" ]; then
  log_skip "Onboarding not completed (status: $ONBOARDING_STATUS). Skipping shell tests."
  end_test
  exit $?
fi
log_pass "Onboarding is complete"

# ---------------------------------------------------------------------------
log_section "1. Shell config defaults"
# ---------------------------------------------------------------------------

CONFIG=$(host_api_get "shell/config")
assert_json_field "$CONFIG" '.enabled' 'false' "Shell disabled by default" || true

POLICY_COUNT=$(echo "$CONFIG" | jq '.policies | length' 2>/dev/null || echo "0")
assert_not_eq "$POLICY_COUNT" "0" "At least one default policy exists" || true

DEFAULT_POLICY=$(echo "$CONFIG" | jq -r '.defaultPolicy' 2>/dev/null || echo "")
assert_eq "$DEFAULT_POLICY" "default" "Default policy ID is 'default'" || true

# ---------------------------------------------------------------------------
log_section "2. Enable shell globally"
# ---------------------------------------------------------------------------

ENABLE_RESPONSE=$(host_api_patch "shell/config" '{"enabled":true}')
assert_json_field "$ENABLE_RESPONSE" '.ok' 'true' "Enable shell returned ok: true" || true

CONFIG_AFTER=$(host_api_get "shell/config")
assert_json_field "$CONFIG_AFTER" '.enabled' 'true' "Shell is now enabled" || true

# ---------------------------------------------------------------------------
log_section "3. Policy CRUD"
# ---------------------------------------------------------------------------

# Create policy
CREATE_POLICY=$(host_api_post "shell/policies" '{"name":"E2E Test Policy","description":"For E2E testing","allowedIps":["10.0.0.0/8"],"deniedIps":[],"inactivityTimeout":300}')
assert_json_field "$CREATE_POLICY" '.ok' 'true' "Policy creation returned ok: true" || true

TEST_POLICY_ID=$(echo "$CREATE_POLICY" | jq -r '.policy.id' 2>/dev/null || echo "")
assert_json_field_not_empty "$CREATE_POLICY" '.policy.id' "Policy has an ID" || true
log_info "Created policy: ${TEST_POLICY_ID}"

# List policies
POLICIES=$(host_api_get "shell/policies")
POLICY_FOUND=$(echo "$POLICIES" | jq -r ".policies[] | select(.id == \"${TEST_POLICY_ID}\") | .name" 2>/dev/null || echo "")
assert_eq "$POLICY_FOUND" "E2E Test Policy" "Created policy found in listing" || true

# Update policy
UPDATE_RESPONSE=$(host_api_patch "shell/policies/${TEST_POLICY_ID}" '{"inactivityTimeout":600}')
assert_json_field "$UPDATE_RESPONSE" '.ok' 'true' "Policy update returned ok: true" || true

UPDATED_TIMEOUT=$(echo "$UPDATE_RESPONSE" | jq -r '.policy.inactivityTimeout' 2>/dev/null || echo "")
assert_eq "$UPDATED_TIMEOUT" "600" "Policy timeout updated to 600" || true

# Cannot delete default policy
DEFAULT_DELETE_STATUS=$(host_api_delete_status "shell/policies/default")
assert_eq "$DEFAULT_DELETE_STATUS" "400" "Cannot delete default policy (400)" || true

# Delete test policy
DELETE_POLICY=$(host_api_delete "shell/policies/${TEST_POLICY_ID}")
assert_json_field "$DELETE_POLICY" '.ok' 'true' "Policy deletion returned ok: true" || true
TEST_POLICY_ID=""

# Verify removal
POLICIES_AFTER=$(host_api_get "shell/policies")
DELETED_FOUND=$(echo "$POLICIES_AFTER" | jq -r '.policies[] | select(.name == "E2E Test Policy") | .id' 2>/dev/null || echo "")
assert_eq "$DELETED_FOUND" "" "Deleted policy no longer in listing" || true

# ---------------------------------------------------------------------------
log_section "4. Policy validation"
# ---------------------------------------------------------------------------

# Empty name
EMPTY_NAME_STATUS=$(host_api_post_status "shell/policies" '{"name":""}')
assert_eq "$EMPTY_NAME_STATUS" "400" "Empty policy name rejected with 400" || true

# Invalid CIDR
INVALID_CIDR_STATUS=$(host_api_post_status "shell/policies" '{"name":"bad-cidr","allowedIps":["192.168.1.0/99"]}')
assert_eq "$INVALID_CIDR_STATUS" "400" "Invalid CIDR /99 rejected with 400" || true

# Name > 100 chars
LONG_NAME=$(printf 'x%.0s' {1..101})
LONG_NAME_STATUS=$(host_api_post_status "shell/policies" "{\"name\":\"${LONG_NAME}\"}")
assert_eq "$LONG_NAME_STATUS" "400" "Policy name > 100 chars rejected with 400" || true

# ---------------------------------------------------------------------------
log_section "5. REST API: enable/disable shell for agent cert"
# ---------------------------------------------------------------------------

# Clean up any leftover agent cert from a previous failed run
host_api_delete "certs/agent/${SHELL_AGENT_LABEL}" 2>/dev/null || true

# Create an agent cert for shell testing
CERT_RESPONSE=$(host_api_post "certs/agent" '{"label":"'"${SHELL_AGENT_LABEL}"'","capabilities":["tunnels:read"]}')
assert_json_field "$CERT_RESPONSE" '.ok' 'true' "Agent cert creation returned ok: true" || true

P12_PASSWORD=$(echo "$CERT_RESPONSE" | jq -r '.p12Password' 2>/dev/null || echo "")

# Extract PEM for agent API calls
P12_PATH="/etc/portlama/pki/agents/${SHELL_AGENT_LABEL}/client.p12"
SHELL_AGENT_CERT_PATH="/tmp/e2e-shell-cert.pem"
SHELL_AGENT_KEY_PATH="/tmp/e2e-shell-key.pem"
host_exec "openssl pkcs12 -in '${P12_PATH}' -clcerts -nokeys -out '${SHELL_AGENT_CERT_PATH}' -passin 'pass:${P12_PASSWORD}' -legacy 2>/dev/null || openssl pkcs12 -in '${P12_PATH}' -clcerts -nokeys -out '${SHELL_AGENT_CERT_PATH}' -passin 'pass:${P12_PASSWORD}'"
host_exec "openssl pkcs12 -in '${P12_PATH}' -nocerts -nodes -out '${SHELL_AGENT_KEY_PATH}' -passin 'pass:${P12_PASSWORD}' -legacy 2>/dev/null || openssl pkcs12 -in '${P12_PATH}' -nocerts -nodes -out '${SHELL_AGENT_KEY_PATH}' -passin 'pass:${P12_PASSWORD}'"
log_pass "Extracted agent PEM cert and key"

# Enable shell for agent
ENABLE_AGENT=$(host_api_post "shell/enable/${SHELL_AGENT_LABEL}" '{"durationMinutes":5}')
assert_json_field "$ENABLE_AGENT" '.ok' 'true' "Shell enable for agent returned ok: true" || true
assert_json_field_not_empty "$ENABLE_AGENT" '.shellEnabledUntil' "shellEnabledUntil is set" || true

log_info "Shell enabled for agent ${SHELL_AGENT_LABEL}"

# Agent-status endpoint with agent cert
AGENT_STATUS=$(host_agent_api_get "$SHELL_AGENT_CERT_PATH" "$SHELL_AGENT_KEY_PATH" "shell/agent-status")
assert_json_field "$AGENT_STATUS" '.globalEnabled' 'true' "Agent sees global shell enabled" || true
assert_json_field "$AGENT_STATUS" '.shellEnabled' 'true' "Agent sees own shell enabled" || true
assert_json_field "$AGENT_STATUS" '.label' "$SHELL_AGENT_LABEL" "Agent-status returns correct label" || true
assert_json_field_not_empty "$AGENT_STATUS" '.shellEnabledUntil' "Agent sees shellEnabledUntil" || true

# Disable shell for agent
DISABLE_AGENT=$(host_api_delete "shell/enable/${SHELL_AGENT_LABEL}")
assert_json_field "$DISABLE_AGENT" '.ok' 'true' "Shell disable for agent returned ok: true" || true

AGENT_STATUS_AFTER=$(host_agent_api_get "$SHELL_AGENT_CERT_PATH" "$SHELL_AGENT_KEY_PATH" "shell/agent-status")
assert_json_field "$AGENT_STATUS_AFTER" '.shellEnabled' 'false' "Agent sees shell disabled after disable" || true

# Shell enable rejected when global toggle off
host_api_patch "shell/config" '{"enabled":false}' || true

REJECT_STATUS=$(host_api_post_status "shell/enable/${SHELL_AGENT_LABEL}" '{"durationMinutes":5}')
assert_eq "$REJECT_STATUS" "400" "Shell enable rejected when globally disabled (400)" || true

# Re-enable for remaining tests
host_api_patch "shell/config" '{"enabled":true}' || true

# ---------------------------------------------------------------------------
log_section "6. Install portlama-agent on VMs for integration test"
# ---------------------------------------------------------------------------

# Pack the portlama-agent tarball locally on macOS
log_info "Packing portlama-agent tarball..."
AGENT_TARBALL_NAME=$(cd "${REPO_ROOT}/packages/portlama-agent" && npm pack --pack-destination /tmp 2>/dev/null | tail -1)
AGENT_TARBALL="/tmp/${AGENT_TARBALL_NAME}"
if [ ! -f "$AGENT_TARBALL" ]; then
  log_fail "npm pack failed — tarball not found at ${AGENT_TARBALL}"
  end_test
  exit 1
fi
log_pass "portlama-agent tarball packed: ${AGENT_TARBALL}"

# --- Install on agent VM ---
log_info "Installing portlama-agent on agent VM..."
multipass transfer "${AGENT_TARBALL}" "portlama-agent:/tmp/portlama-agent.tgz"

# Install npm and tmux on agent VM (apt-get install is idempotent)
agent_exec "apt-get update -qq && apt-get install -y -qq npm tmux 2>&1 | tail -5 || true"
agent_exec "npm install -g /tmp/portlama-agent.tgz 2>&1 | tail -5"

# Verify installation
AGENT_VM_PORTLAMA=$(agent_exec "which portlama-agent 2>/dev/null || echo NOT_FOUND")
if echo "$AGENT_VM_PORTLAMA" | grep -q "NOT_FOUND"; then
  log_fail "portlama-agent not installed on agent VM"
  end_test
  exit 1
fi
log_pass "portlama-agent installed on agent VM"

# Verify tmux
AGENT_VM_TMUX=$(agent_exec "which tmux 2>/dev/null || echo NOT_FOUND")
if echo "$AGENT_VM_TMUX" | grep -q "NOT_FOUND"; then
  log_fail "tmux not installed on agent VM"
  end_test
  exit 1
fi
log_pass "tmux installed on agent VM"

# --- Install on host VM (for the WebSocket test client script) ---
log_info "Installing portlama-agent on host VM..."
multipass transfer "${AGENT_TARBALL}" "portlama-host:/tmp/portlama-agent.tgz"
host_exec "npm install -g /tmp/portlama-agent.tgz 2>&1 | tail -5"
log_pass "portlama-agent installed on host VM"

# Clean up local tarball
rm -f "${AGENT_TARBALL}"

# ---------------------------------------------------------------------------
log_section "7. Configure and start shell-server on agent VM"
# ---------------------------------------------------------------------------

# Get host VM IP for the agent to connect to
HOST_IP="${HOST_IP:-$(multipass info portlama-host --format json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['info']['portlama-host']['ipv4'][0])" 2>/dev/null || multipass info portlama-host 2>/dev/null | grep -oE 'IPv4:\s+[0-9.]+' | awk '{print $2}')}"

# Create agent.json config on agent VM
# The P12 was placed at /root/.portlama/client.p12 by setup-agent.sh
# The password is in AGENT_P12_PASSWORD env var from the orchestrator
agent_exec "cat > /root/.portlama/agent.json << 'AGENTEOF'
{
  \"panelUrl\": \"https://${HOST_IP}:9292\",
  \"p12Path\": \"/root/.portlama/client.p12\",
  \"p12Password\": \"${AGENT_P12_PASSWORD}\"
}
AGENTEOF"
log_pass "Agent config written to /root/.portlama/agent.json"

# Enable shell for the test-agent (the integration agent)
ENABLE_INTEGRATION=$(host_api_post "shell/enable/${INTEGRATION_AGENT_LABEL}" '{"durationMinutes":10}')
assert_json_field "$ENABLE_INTEGRATION" '.ok' 'true' "Shell enabled for ${INTEGRATION_AGENT_LABEL}" || true

# Start shell-server on agent VM in background
agent_exec "nohup portlama-agent shell-server > /tmp/shell-server.log 2>&1 & echo \$! > /tmp/shell-server.pid"
SHELL_SERVER_PID=$(agent_exec "cat /tmp/shell-server.pid 2>/dev/null || echo 0")
log_info "Shell-server started on agent VM (PID: ${SHELL_SERVER_PID})"

# Wait for shell-server to initialize, poll for it to connect to the relay
# The shell-server polls agent-status every 10s, then connects via WebSocket.
# Give it up to 30 seconds.
SHELL_SERVER_READY=0
for i in $(seq 1 30); do
  # Check the shell-server log for connection confirmation
  SERVER_LOG=$(agent_exec "cat /tmp/shell-server.log 2>/dev/null || true")
  if echo "$SERVER_LOG" | grep -q "Connected to panel relay"; then
    SHELL_SERVER_READY=1
    break
  fi
  # Also check if the process is still alive
  STILL_RUNNING=$(agent_exec "kill -0 ${SHELL_SERVER_PID} 2>/dev/null && echo YES || echo NO")
  if echo "$STILL_RUNNING" | grep -q "NO"; then
    log_info "Shell-server process exited early. Log output:"
    log_info "$SERVER_LOG"
    break
  fi
  sleep 1
done

if [ "$SHELL_SERVER_READY" -eq 1 ]; then
  log_pass "Shell-server connected to panel relay"
else
  # The shell-server may still be polling (10s interval). That is acceptable —
  # the WebSocket test below will trigger the connection flow.
  log_info "Shell-server not yet confirmed connected (may still be polling). Proceeding."
fi

# ---------------------------------------------------------------------------
log_section "8. Full integration: admin connects and executes a command"
# ---------------------------------------------------------------------------

# Create an admin P12 on the host VM from the existing admin cert+key
host_exec "openssl pkcs12 -export -out /tmp/admin.p12 -inkey /etc/portlama/pki/client.key -in /etc/portlama/pki/client.crt -certfile /etc/portlama/pki/ca.crt -passout pass:adminpass -legacy 2>/dev/null || openssl pkcs12 -export -out /tmp/admin.p12 -inkey /etc/portlama/pki/client.key -in /etc/portlama/pki/client.crt -certfile /etc/portlama/pki/ca.crt -passout pass:adminpass"
log_pass "Admin P12 created on host VM"

# Create an admin agent.json config on host VM (for the ws module to find certs)
host_exec "cat > /tmp/admin-agent.json << 'ADMEOF'
{
  \"panelUrl\": \"https://127.0.0.1:9292\",
  \"p12Path\": \"/tmp/admin.p12\",
  \"p12Password\": \"adminpass\"
}
ADMEOF"

# Write the WebSocket test client script to the host VM.
# This script:
#   1. Extracts PEM from the admin P12
#   2. Connects to the panel shell relay as admin
#   3. Waits for the session-started message (agent spawns tmux)
#   4. Sends 'echo PORTLAMA_SHELL_E2E_MARKER\n' as input
#   5. Reads output messages until the marker appears
#   6. Exits with code 0 on success, 1 on timeout
#
# We use the ws module from the globally-installed portlama-agent package.
# Node.js ESM is used (the .mjs extension ensures ESM mode).

# Transfer the test script content via heredoc on the host VM
host_exec "cat > /tmp/test-shell-client.mjs << 'CLIENTEOF'
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

// Resolve ws from global node_modules (installed with portlama-agent)
// Try common global paths — npm on Ubuntu may use /usr/local/lib or /usr/lib
let WebSocket;
const paths = [
  '/usr/lib/node_modules/@lamalibre/portlama-agent/',
  '/usr/local/lib/node_modules/@lamalibre/portlama-agent/',
];
for (const p of paths) {
  try {
    const req = createRequire(p);
    WebSocket = req('ws');
    break;
  } catch { /* try next */ }
}
if (!WebSocket) {
  console.error('Could not find ws module in global node_modules');
  process.exit(1);
}

const TIMEOUT_MS = 45000;
const MARKER = 'PORTLAMA_SHELL_E2E_MARKER';
const AGENT_LABEL = process.argv[2] || 'test-agent';

// Extract PEM from P12
const p12Path = '/tmp/admin.p12';
const p12Pass = 'adminpass';
const pemDir = '/tmp/admin-pem';

execSync('mkdir -p ' + pemDir);
try {
  execSync('openssl pkcs12 -in ' + p12Path + ' -clcerts -nokeys -out ' + pemDir + '/cert.pem -passin pass:' + p12Pass + ' -legacy 2>/dev/null');
} catch {
  execSync('openssl pkcs12 -in ' + p12Path + ' -clcerts -nokeys -out ' + pemDir + '/cert.pem -passin pass:' + p12Pass);
}
try {
  execSync('openssl pkcs12 -in ' + p12Path + ' -nocerts -nodes -out ' + pemDir + '/key.pem -passin pass:' + p12Pass + ' -legacy 2>/dev/null');
} catch {
  execSync('openssl pkcs12 -in ' + p12Path + ' -nocerts -nodes -out ' + pemDir + '/key.pem -passin pass:' + p12Pass);
}

const cert = readFileSync(pemDir + '/cert.pem');
const key = readFileSync(pemDir + '/key.pem');

const wsUrl = 'wss://127.0.0.1:9292/api/shell/connect/' + encodeURIComponent(AGENT_LABEL);

console.log('Connecting to: ' + wsUrl);

const ws = new WebSocket(wsUrl, { cert, key, rejectUnauthorized: false });

let sessionStarted = false;
let outputReceived = false;
let allOutput = '';

const timer = setTimeout(() => {
  console.error('TIMEOUT: No marker found within ' + TIMEOUT_MS + 'ms');
  console.error('Collected output: ' + allOutput);
  ws.close();
  process.exit(1);
}, TIMEOUT_MS);

ws.on('open', () => {
  console.log('WebSocket connected to panel relay');
});

ws.on('message', (raw) => {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }

  console.log('Received message type: ' + msg.type);

  switch (msg.type) {
    case 'waiting':
      console.log('Waiting for agent to connect...');
      break;

    case 'connected':
      console.log('Agent connected, relay active');
      break;

    case 'session-started':
      console.log('Session started: ' + msg.sessionId);
      sessionStarted = true;
      // Wait a moment for the shell prompt to be ready, then send the command
      setTimeout(() => {
        console.log('Sending test command...');
        ws.send(JSON.stringify({ type: 'input', data: 'echo ' + MARKER }));
        // Send Enter key separately for reliability
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'special-key', key: 'Enter' }));
        }, 500);
      }, 2000);
      break;

    case 'output':
      if (msg.data) {
        allOutput += msg.data;
        // Check if our marker appears in the output
        if (msg.data.includes(MARKER) && sessionStarted) {
          // The marker will appear twice: once as the typed command and once as
          // the echo output. Wait for the second occurrence to confirm execution.
          const occurrences = (allOutput.match(new RegExp(MARKER, 'g')) || []).length;
          if (occurrences >= 2 && !outputReceived) {
            outputReceived = true;
            console.log('SUCCESS: Marker found in shell output');
            clearTimeout(timer);
            ws.close(1000);
          }
        }
      }
      break;

    case 'error':
      console.error('Error from relay: ' + msg.message);
      clearTimeout(timer);
      ws.close();
      process.exit(1);
      break;
  }
});

ws.on('close', (code) => {
  clearTimeout(timer);
  if (outputReceived) {
    console.log('Test passed — shell session completed successfully');
    process.exit(0);
  } else {
    console.error('WebSocket closed (code ' + code + ') before marker was found');
    console.error('Session started: ' + sessionStarted);
    console.error('All output: ' + allOutput);
    process.exit(1);
  }
});

ws.on('error', (err) => {
  console.error('WebSocket error: ' + err.message);
  clearTimeout(timer);
  process.exit(1);
});
CLIENTEOF"
log_pass "Test client script written to host VM"

# Record session count before the test
SESSIONS_BEFORE=$(host_api_get "shell/sessions")
SESSION_COUNT_BEFORE=$(echo "$SESSIONS_BEFORE" | jq '.sessions | length' 2>/dev/null || echo "0")
log_info "Session count before integration test: ${SESSION_COUNT_BEFORE}"

# Run the test client on the host VM
# The shell-server on the agent VM should already be connected to the relay
# (or will connect on its next poll cycle). The admin connects and the relay
# pairs them.
log_info "Running WebSocket shell test client on host VM..."
set +e
WS_TEST_OUTPUT=$(host_exec "timeout 60 node /tmp/test-shell-client.mjs ${INTEGRATION_AGENT_LABEL} 2>&1" 2>&1)
WS_TEST_RC=$?
set -e

log_info "WebSocket test output:"
# Print each line with indentation for readability
echo "$WS_TEST_OUTPUT" | while IFS= read -r line; do
  log_info "  $line"
done

if [ "$WS_TEST_RC" -eq 0 ]; then
  log_pass "Full integration: admin connected, executed command, verified output"
else
  log_fail "Full integration test failed (exit code: ${WS_TEST_RC})"
  # Dump shell-server log from agent VM for debugging
  log_info "Shell-server log from agent VM:"
  SLOG=$(agent_exec "tail -30 /tmp/shell-server.log 2>/dev/null || true")
  echo "$SLOG" | while IFS= read -r line; do
    log_info "  $line"
  done
fi

# ---------------------------------------------------------------------------
log_section "9. Verify session audit log"
# ---------------------------------------------------------------------------

# Give the panel a moment to flush the session entry
sleep 2

SESSIONS_AFTER=$(host_api_get "shell/sessions")
SESSION_COUNT_AFTER=$(echo "$SESSIONS_AFTER" | jq '.sessions | length' 2>/dev/null || echo "0")

# A new session entry should have been created
if [ "$SESSION_COUNT_AFTER" -gt "$SESSION_COUNT_BEFORE" ]; then
  log_pass "New session entry created in audit log (before: ${SESSION_COUNT_BEFORE}, after: ${SESSION_COUNT_AFTER})"
else
  log_fail "No new session entry in audit log (before: ${SESSION_COUNT_BEFORE}, after: ${SESSION_COUNT_AFTER})" || true
fi

# Verify the session has the correct agent label
LATEST_SESSION_LABEL=$(echo "$SESSIONS_AFTER" | jq -r '.sessions[-1].agentLabel // empty' 2>/dev/null || echo "")
if [ "$LATEST_SESSION_LABEL" = "$INTEGRATION_AGENT_LABEL" ]; then
  log_pass "Latest session belongs to agent: ${INTEGRATION_AGENT_LABEL}"
else
  # Sessions may be sorted differently; search all sessions
  FOUND_LABEL=$(echo "$SESSIONS_AFTER" | jq -r ".sessions[] | select(.agentLabel == \"${INTEGRATION_AGENT_LABEL}\") | .agentLabel" 2>/dev/null | head -1)
  if [ "$FOUND_LABEL" = "$INTEGRATION_AGENT_LABEL" ]; then
    log_pass "Session for agent ${INTEGRATION_AGENT_LABEL} found in audit log"
  else
    log_fail "Session for agent ${INTEGRATION_AGENT_LABEL} not found in audit log" || true
  fi
fi

# Kill shell-server on agent VM
agent_exec "pkill -f 'portlama-agent shell-server' 2>/dev/null || true" 2>/dev/null || true
agent_exec "tmux kill-session -t portlama-shell 2>/dev/null || true" 2>/dev/null || true
log_info "Shell-server stopped on agent VM"

# ---------------------------------------------------------------------------
log_section "10. File transfer endpoints (501)"
# ---------------------------------------------------------------------------

# Re-enable shell for the REST-test agent cert to pass access validation
host_api_post "shell/enable/${SHELL_AGENT_LABEL}" '{"durationMinutes":5}' || true

FILE_GET_STATUS=$(host_api_get_status "shell/file/${SHELL_AGENT_LABEL}?path=/tmp/test")
assert_eq "$FILE_GET_STATUS" "501" "File download returns 501 (not yet implemented)" || true

FILE_POST_STATUS=$(host_api_post_status "shell/file/${SHELL_AGENT_LABEL}" '{}')
# POST without path query param should fail with 400
assert_eq "$FILE_POST_STATUS" "400" "File upload without path returns 400" || true

# ---------------------------------------------------------------------------
log_section "11. Input validation"
# ---------------------------------------------------------------------------

# Non-existent default policy
INVALID_DEFAULT_STATUS=$(host_api_patch_status "shell/config" '{"defaultPolicy":"nonexistent-policy"}')
assert_eq "$INVALID_DEFAULT_STATUS" "400" "Non-existent default policy rejected (400)" || true

# Duration too small
SMALL_DURATION_STATUS=$(host_api_post_status "shell/enable/${SHELL_AGENT_LABEL}" '{"durationMinutes":0}')
assert_eq "$SMALL_DURATION_STATUS" "400" "durationMinutes=0 rejected (400)" || true

# Duration too large
LARGE_DURATION_STATUS=$(host_api_post_status "shell/enable/${SHELL_AGENT_LABEL}" '{"durationMinutes":9999}')
assert_eq "$LARGE_DURATION_STATUS" "400" "durationMinutes=9999 rejected (400)" || true

# Non-existent agent
NOAGENT_STATUS=$(host_api_post_status "shell/enable/nonexistent-agent" '{"durationMinutes":5}')
assert_eq "$NOAGENT_STATUS" "404" "Shell enable for non-existent agent (404)" || true

# Invalid label format
BADLABEL_STATUS=$(host_api_post_status "shell/enable/BAD_LABEL!" '{"durationMinutes":5}')
assert_eq "$BADLABEL_STATUS" "400" "Invalid label format rejected (400)" || true

# ---------------------------------------------------------------------------
log_section "12. Cleanup"
# ---------------------------------------------------------------------------

# Disable shell globally (also done by trap, but explicit for clarity)
host_api_patch "shell/config" '{"enabled":false}' || true

CONFIG_FINAL=$(host_api_get "shell/config")
assert_json_field "$CONFIG_FINAL" '.enabled' 'false' "Shell disabled after cleanup" || true

log_info "Shell test cleanup complete"

end_test
