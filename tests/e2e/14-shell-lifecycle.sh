#!/usr/bin/env bash
# ============================================================================
# 14 — Shell Lifecycle
# ============================================================================
# Verifies remote shell configuration and management endpoints:
# - Shell config defaults (disabled by default, default policy exists)
# - Enable/disable shell globally
# - Policy CRUD (create, read, update, delete)
# - Policy validation (empty name, invalid CIDR, duplicate ID)
# - Enable/disable shell for agent (requires agent cert to exist)
# - Shell enable guard: global toggle must be on
# - Session audit log
# - File transfer endpoints (501 — not yet implemented)
# - Recordings listing and download (501)
# - Input validation (invalid defaultPolicy, out-of-range duration, etc.)
# ============================================================================

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/helpers.sh"

require_commands curl jq

begin_test "14 — Shell Lifecycle"

# ---------------------------------------------------------------------------
log_section "Pre-flight: check onboarding is complete"
# ---------------------------------------------------------------------------

ONBOARDING_STATUS=$(api_get "onboarding/status" | jq -r '.status' 2>/dev/null || echo "unknown")
if [ "$ONBOARDING_STATUS" != "COMPLETED" ]; then
  log_skip "Onboarding not completed — skipping shell tests"
  end_test
  exit $?
fi
log_pass "Onboarding is complete"

# Track whether we created a test policy so cleanup can remove it
CREATED_POLICY_ID=""
# Track the original shell enabled state so we can restore it
ORIGINAL_ENABLED=""

cleanup() {
  # Delete test policy if it still exists
  if [ -n "$CREATED_POLICY_ID" ]; then
    api_delete "shell/policies/${CREATED_POLICY_ID}" 2>/dev/null || true
  fi
  # Restore shell to disabled state
  api_patch "shell/config" '{"enabled":false}' 2>/dev/null || true
}
trap cleanup EXIT

# ===========================================================================
# 1. Shell config defaults
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Shell config defaults"
# ---------------------------------------------------------------------------

CONFIG_RESPONSE=$(api_get "shell/config")
assert_json_field "$CONFIG_RESPONSE" '.enabled' 'false' "Shell is disabled by default" || true
assert_json_field "$CONFIG_RESPONSE" '.defaultPolicy' 'default' "Default policy ID is 'default'" || true

POLICY_COUNT=$(echo "$CONFIG_RESPONSE" | jq '.policies | length' 2>/dev/null || echo "0")
if [ "$POLICY_COUNT" -ge 1 ]; then
  log_pass "At least one policy exists (count: ${POLICY_COUNT})"
else
  log_fail "No policies found in shell config"
fi

DEFAULT_POLICY_NAME=$(echo "$CONFIG_RESPONSE" | jq -r '.policies[] | select(.id == "default") | .name' 2>/dev/null || echo "")
assert_eq "$DEFAULT_POLICY_NAME" "Default" "Default policy has name 'Default'" || true

# Save original enabled state for restoration
ORIGINAL_ENABLED=$(echo "$CONFIG_RESPONSE" | jq -r '.enabled' 2>/dev/null || echo "false")

# ===========================================================================
# 2. Enable shell globally
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Enable shell globally"
# ---------------------------------------------------------------------------

ENABLE_RESPONSE=$(api_patch "shell/config" '{"enabled":true}')
assert_json_field "$ENABLE_RESPONSE" '.ok' 'true' "PATCH shell/config returned ok: true" || true

# Verify enabled state persisted
CONFIG_AFTER_ENABLE=$(api_get "shell/config")
assert_json_field "$CONFIG_AFTER_ENABLE" '.enabled' 'true' "Shell is now enabled" || true

# ===========================================================================
# 3. Policy CRUD
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Create a shell policy"
# ---------------------------------------------------------------------------

CREATE_POLICY_RESPONSE=$(api_post "shell/policies" '{"name":"e2e-test-policy","id":"e2e-test-policy","description":"Policy created by E2E tests","inactivityTimeout":300}')
assert_json_field "$CREATE_POLICY_RESPONSE" '.ok' 'true' "Policy creation returned ok: true" || true
assert_json_field "$CREATE_POLICY_RESPONSE" '.policy.id' 'e2e-test-policy' "Policy ID matches" || true
assert_json_field "$CREATE_POLICY_RESPONSE" '.policy.name' 'e2e-test-policy' "Policy name matches" || true
assert_json_field "$CREATE_POLICY_RESPONSE" '.policy.inactivityTimeout' '300' "Inactivity timeout is 300" || true
CREATED_POLICY_ID="e2e-test-policy"

# ---------------------------------------------------------------------------
log_section "Verify policy in listing"
# ---------------------------------------------------------------------------

POLICIES_RESPONSE=$(api_get "shell/policies")
FOUND_POLICY=$(echo "$POLICIES_RESPONSE" | jq -r '.policies[] | select(.id == "e2e-test-policy") | .id' 2>/dev/null || echo "")
assert_eq "$FOUND_POLICY" "e2e-test-policy" "Created policy appears in listing" || true

# ---------------------------------------------------------------------------
log_section "Update the policy"
# ---------------------------------------------------------------------------

UPDATE_POLICY_RESPONSE=$(api_patch "shell/policies/e2e-test-policy" '{"inactivityTimeout":600,"description":"Updated by E2E tests"}')
assert_json_field "$UPDATE_POLICY_RESPONSE" '.ok' 'true' "Policy update returned ok: true" || true
assert_json_field "$UPDATE_POLICY_RESPONSE" '.policy.inactivityTimeout' '600' "Inactivity timeout updated to 600" || true
assert_json_field "$UPDATE_POLICY_RESPONSE" '.policy.description' 'Updated by E2E tests' "Description updated" || true

# Verify update persisted
POLICIES_AFTER_UPDATE=$(api_get "shell/policies")
UPDATED_TIMEOUT=$(echo "$POLICIES_AFTER_UPDATE" | jq -r '.policies[] | select(.id == "e2e-test-policy") | .inactivityTimeout' 2>/dev/null || echo "")
assert_eq "$UPDATED_TIMEOUT" "600" "Updated timeout persisted in listing" || true

# ---------------------------------------------------------------------------
log_section "Cannot delete the default policy"
# ---------------------------------------------------------------------------

DELETE_DEFAULT_STATUS=$(api_delete_status "shell/policies/default")
assert_eq "$DELETE_DEFAULT_STATUS" "400" "Cannot delete the default policy (HTTP 400)" || true

# ---------------------------------------------------------------------------
log_section "Delete the e2e-test-policy"
# ---------------------------------------------------------------------------

DELETE_POLICY_RESPONSE=$(api_delete "shell/policies/e2e-test-policy")
assert_json_field "$DELETE_POLICY_RESPONSE" '.ok' 'true' "Policy deletion returned ok: true" || true

# Verify removal
POLICIES_AFTER_DELETE=$(api_get "shell/policies")
FOUND_DELETED=$(echo "$POLICIES_AFTER_DELETE" | jq -r '.policies[] | select(.id == "e2e-test-policy") | .id' 2>/dev/null || echo "")
assert_eq "$FOUND_DELETED" "" "Deleted policy no longer in listing" || true
CREATED_POLICY_ID=""

# ===========================================================================
# 4. Policy validation
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Policy validation"
# ---------------------------------------------------------------------------

# Empty name
EMPTY_NAME_STATUS=$(api_post_status "shell/policies" '{"name":""}')
assert_eq "$EMPTY_NAME_STATUS" "400" "POST policy with empty name rejected (HTTP 400)" || true

# Invalid CIDR (prefix > 32)
INVALID_CIDR_STATUS=$(api_post_status "shell/policies" '{"name":"bad-cidr","allowedIps":["192.168.1.0/99"]}')
assert_eq "$INVALID_CIDR_STATUS" "400" "POST policy with invalid CIDR /99 rejected (HTTP 400)" || true

# Duplicate policy ID
api_post "shell/policies" '{"name":"dup-test","id":"dup-test"}' > /dev/null 2>&1 || true
DUP_STATUS=$(api_post_status "shell/policies" '{"name":"dup-test","id":"dup-test"}')
assert_eq "$DUP_STATUS" "409" "POST policy with duplicate ID rejected (HTTP 409)" || true
# Clean up the dup-test policy
api_delete "shell/policies/dup-test" > /dev/null 2>&1 || true

# ===========================================================================
# 5. Enable shell for agent
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Enable shell for agent"
# ---------------------------------------------------------------------------

AGENT_CERTS_RESPONSE=$(api_get "certs/agent")
AGENT_COUNT=$(echo "$AGENT_CERTS_RESPONSE" | jq '.agents | length' 2>/dev/null || echo "0")

if [ "$AGENT_COUNT" -gt 0 ]; then
  AGENT_LABEL=$(echo "$AGENT_CERTS_RESPONSE" | jq -r '.agents[0].label' 2>/dev/null || echo "")

  if [ -n "$AGENT_LABEL" ] && [ "$AGENT_LABEL" != "null" ]; then
    log_info "Found agent: ${AGENT_LABEL}"

    # Enable shell for agent with 5-minute duration
    ENABLE_AGENT_RESPONSE=$(api_post "shell/enable/${AGENT_LABEL}" '{"durationMinutes":5}')
    assert_json_field "$ENABLE_AGENT_RESPONSE" '.ok' 'true' "Shell enable for agent returned ok: true" || true
    assert_json_field_not_empty "$ENABLE_AGENT_RESPONSE" '.shellEnabledUntil' "shellEnabledUntil is set" || true

    # Verify shellEnabledUntil is in the future
    SHELL_UNTIL=$(echo "$ENABLE_AGENT_RESPONSE" | jq -r '.shellEnabledUntil' 2>/dev/null || echo "")
    if [ -n "$SHELL_UNTIL" ] && [ "$SHELL_UNTIL" != "null" ]; then
      log_pass "shellEnabledUntil has a value: ${SHELL_UNTIL}"
    else
      log_fail "shellEnabledUntil is missing or null"
    fi

    # Disable shell for agent
    DISABLE_AGENT_RESPONSE=$(api_delete "shell/enable/${AGENT_LABEL}")
    assert_json_field "$DISABLE_AGENT_RESPONSE" '.ok' 'true' "Shell disable for agent returned ok: true" || true
  else
    log_skip "Agent label is empty — skipping agent shell enable tests"
  fi
else
  log_skip "No agent certificates found — skipping agent shell enable tests"
fi

# ===========================================================================
# 6. Shell enable without global toggle
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Shell enable without global toggle"
# ---------------------------------------------------------------------------

# Disable shell globally first
api_patch "shell/config" '{"enabled":false}' > /dev/null 2>&1

if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  ENABLE_NO_GLOBAL_STATUS=$(api_post_status "shell/enable/${AGENT_LABEL}" '{"durationMinutes":5}')
  assert_eq "$ENABLE_NO_GLOBAL_STATUS" "400" "Cannot enable shell for agent when globally disabled (HTTP 400)" || true
else
  log_skip "No agent certificates — skipping global toggle guard test"
fi

# Re-enable globally for subsequent tests
api_patch "shell/config" '{"enabled":true}' > /dev/null 2>&1

# ===========================================================================
# 7. Session audit log
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Session audit log"
# ---------------------------------------------------------------------------

SESSIONS_RESPONSE=$(api_get "shell/sessions")
SESSIONS_TYPE=$(echo "$SESSIONS_RESPONSE" | jq -r '.sessions | type' 2>/dev/null || echo "unknown")
assert_eq "$SESSIONS_TYPE" "array" "GET shell/sessions returns a sessions array" || true

# ===========================================================================
# 8. File transfer endpoints return 501
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "File transfer endpoints (not yet implemented)"
# ---------------------------------------------------------------------------

# File transfer endpoints require shell access validation (global enabled +
# agent exists + shellEnabledUntil in the future + IP allowed). We need a
# valid agent with shell enabled to reach the 501 response.

if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  # Enable shell for agent so file transfer validation passes
  api_post "shell/enable/${AGENT_LABEL}" '{"durationMinutes":5}' > /dev/null 2>&1 || true

  FILE_DOWNLOAD_STATUS=$(api_get_status "shell/file/${AGENT_LABEL}?path=/tmp/test")
  assert_eq "$FILE_DOWNLOAD_STATUS" "501" "GET shell/file/:label returns 501 (not implemented)" || true

  FILE_UPLOAD_STATUS=$(api_post_status "shell/file/${AGENT_LABEL}?path=/tmp/test")
  assert_eq "$FILE_UPLOAD_STATUS" "501" "POST shell/file/:label returns 501 (not implemented)" || true

  # Clean up: disable agent shell
  api_delete "shell/enable/${AGENT_LABEL}" > /dev/null 2>&1 || true
else
  log_skip "No agent certificates — skipping file transfer endpoint tests"
fi

# ===========================================================================
# 9. Recordings listing
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Recordings listing"
# ---------------------------------------------------------------------------

if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  RECORDINGS_RESPONSE=$(api_get "shell/recordings/${AGENT_LABEL}")
  RECORDINGS_TYPE=$(echo "$RECORDINGS_RESPONSE" | jq -r '.recordings | type' 2>/dev/null || echo "unknown")
  assert_eq "$RECORDINGS_TYPE" "array" "GET shell/recordings/:label returns a recordings array" || true

  # Recording download for a non-existent session returns 404
  RECORDING_DL_STATUS=$(api_get_status "shell/recordings/${AGENT_LABEL}/00000000-0000-0000-0000-000000000000")
  assert_eq "$RECORDING_DL_STATUS" "404" "Recording download for non-existent session returns 404" || true
else
  log_skip "No agent certificates — skipping recordings tests"
fi

# ===========================================================================
# 10. Input validation
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Input validation"
# ---------------------------------------------------------------------------

# PATCH config with invalid defaultPolicy (non-existent policy)
INVALID_DEFAULT_STATUS=$(api_patch_status "shell/config" '{"defaultPolicy":"does-not-exist"}')
assert_eq "$INVALID_DEFAULT_STATUS" "400" "PATCH config with non-existent defaultPolicy rejected (HTTP 400)" || true

# POST enable with durationMinutes: 0 (min is 5)
if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  DURATION_ZERO_STATUS=$(api_post_status "shell/enable/${AGENT_LABEL}" '{"durationMinutes":0}')
  assert_eq "$DURATION_ZERO_STATUS" "400" "POST enable with durationMinutes: 0 rejected (HTTP 400)" || true

  # POST enable with durationMinutes: 9999 (max is 480)
  DURATION_HIGH_STATUS=$(api_post_status "shell/enable/${AGENT_LABEL}" '{"durationMinutes":9999}')
  assert_eq "$DURATION_HIGH_STATUS" "400" "POST enable with durationMinutes: 9999 rejected (HTTP 400)" || true
else
  log_skip "No agent certificates — skipping agent enable validation tests"
fi

# POST policy with name > 100 chars
LONG_NAME=$(printf 'x%.0s' {1..101})
LONG_NAME_STATUS=$(api_post_status "shell/policies" "{\"name\":\"${LONG_NAME}\"}")
assert_eq "$LONG_NAME_STATUS" "400" "POST policy with name > 100 chars rejected (HTTP 400)" || true

# POST policy with invalid policy ID characters
INVALID_ID_STATUS=$(api_post_status "shell/policies" '{"name":"valid-name","id":"INVALID_ID!"}')
assert_eq "$INVALID_ID_STATUS" "400" "POST policy with invalid ID characters rejected (HTTP 400)" || true

# PATCH non-existent policy returns 404
PATCH_MISSING_STATUS=$(api_patch_status "shell/policies/does-not-exist" '{"name":"updated"}')
assert_eq "$PATCH_MISSING_STATUS" "404" "PATCH non-existent policy returns 404" || true

# DELETE non-existent policy returns 404
DELETE_MISSING_STATUS=$(api_delete_status "shell/policies/does-not-exist")
assert_eq "$DELETE_MISSING_STATUS" "404" "DELETE non-existent policy returns 404" || true

# POST enable for non-existent agent returns 404
ENABLE_MISSING_STATUS=$(api_post_status "shell/enable/does-not-exist" '{"durationMinutes":5}')
assert_eq "$ENABLE_MISSING_STATUS" "404" "POST enable for non-existent agent returns 404" || true

# DELETE enable for non-existent agent returns 404
DISABLE_MISSING_STATUS=$(api_delete_status "shell/enable/does-not-exist")
assert_eq "$DISABLE_MISSING_STATUS" "404" "DELETE enable for non-existent agent returns 404" || true

# Invalid agent label format (uppercase, special chars)
INVALID_LABEL_STATUS=$(api_post_status "shell/enable/INVALID_LABEL!" '{"durationMinutes":5}')
assert_eq "$INVALID_LABEL_STATUS" "400" "POST enable with invalid label format rejected (HTTP 400)" || true

# File path validation: null bytes
if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  # Enable shell briefly to test file path validation
  api_post "shell/enable/${AGENT_LABEL}" '{"durationMinutes":5}' > /dev/null 2>&1 || true

  # Missing path query parameter
  MISSING_PATH_STATUS=$(api_get_status "shell/file/${AGENT_LABEL}")
  assert_eq "$MISSING_PATH_STATUS" "400" "GET shell/file without path query rejected (HTTP 400)" || true

  # Clean up
  api_delete "shell/enable/${AGENT_LABEL}" > /dev/null 2>&1 || true
fi

# Recording with invalid session ID (not a UUID)
if [ "$AGENT_COUNT" -gt 0 ] && [ -n "${AGENT_LABEL:-}" ] && [ "$AGENT_LABEL" != "null" ]; then
  INVALID_SESSION_STATUS=$(api_get_status "shell/recordings/${AGENT_LABEL}/not-a-uuid")
  assert_eq "$INVALID_SESSION_STATUS" "400" "Recording with invalid session ID rejected (HTTP 400)" || true
fi

# ===========================================================================
# 11. Cleanup
# ===========================================================================

# ---------------------------------------------------------------------------
log_section "Cleanup"
# ---------------------------------------------------------------------------

# Disable shell globally (cleanup trap will also do this)
DISABLE_RESPONSE=$(api_patch "shell/config" '{"enabled":false}')
assert_json_field "$DISABLE_RESPONSE" '.ok' 'true' "Shell disabled globally for cleanup" || true

# Verify disabled
FINAL_CONFIG=$(api_get "shell/config")
assert_json_field "$FINAL_CONFIG" '.enabled' 'false' "Shell is disabled after cleanup" || true

# Remove trap since cleanup is done
trap - EXIT

log_pass "Cleanup complete — shell state restored"

end_test
