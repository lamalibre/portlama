#!/bin/bash
# ADVISORY GUARD RAIL — This wrapper provides a best-effort command filter
# but is NOT a security boundary. Users with shell access can bypass it by
# spawning a subshell, using command aliases, or modifying the blocklist file.
# The primary security controls are the 5-gate auth chain and session recording.
#
# portlama-shell — restricted shell wrapper for remote sessions
#
# This script wraps command execution with blocklist checking.
# It reads a blocklist from ~/.portlama/shell-blocklist.json and rejects
# any commands that match hard-blocked patterns (exact or regex) or
# restricted prefixes.
#
# All commands are logged to stdout (which tmux pipe-pane captures).

set -euo pipefail

BLOCKLIST_FILE="$HOME/.portlama/shell-blocklist.json"
SHELL_HISTORY_FILE="$HOME/.portlama/shell-history.log"

RED='\033[0;31m'
YELLOW='\033[0;33m'
DIM='\033[2m'
RESET='\033[0m'

# Parse blocklist JSON into arrays.
# Expected format:
# {
#   "hardBlocked": ["rm -rf /", "mkfs", "dd if="],
#   "blockedPatterns": ["rm\\s+-rf\\s+/", ":(){ :|:& };:"],
#   "restrictedPrefixes": ["sudo", "su ", "chmod 777"]
# }
HARD_BLOCKED=()
BLOCKED_PATTERNS=()
RESTRICTED_PREFIXES=()

load_blocklist() {
  if [[ ! -f "$BLOCKLIST_FILE" ]]; then
    return
  fi

  # Use python3 (available on macOS) to parse JSON reliably
  local json
  json=$(cat "$BLOCKLIST_FILE")

  # Read hard-blocked entries
  while IFS= read -r entry; do
    [[ -n "$entry" ]] && HARD_BLOCKED+=("$entry")
  done < <(echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data.get('hardBlocked', []):
        print(item)
except:
    pass
" 2>/dev/null)

  # Read blocked regex patterns
  while IFS= read -r entry; do
    [[ -n "$entry" ]] && BLOCKED_PATTERNS+=("$entry")
  done < <(echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data.get('blockedPatterns', []):
        print(item)
except:
    pass
" 2>/dev/null)

  # Read restricted prefixes
  while IFS= read -r entry; do
    [[ -n "$entry" ]] && RESTRICTED_PREFIXES+=("$entry")
  done < <(echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data.get('restrictedPrefixes', []):
        print(item)
except:
    pass
" 2>/dev/null)
}

# Check if a command is blocked.
# Returns 0 if blocked, 1 if allowed.
is_blocked() {
  local cmd="$1"

  # Trim leading/trailing whitespace
  cmd="$(echo "$cmd" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  # Skip empty commands
  if [[ -z "$cmd" ]]; then
    return 1
  fi

  # Check hard-blocked exact matches
  for blocked in "${HARD_BLOCKED[@]+"${HARD_BLOCKED[@]}"}"; do
    if [[ "$cmd" == "$blocked" ]]; then
      return 0
    fi
  done

  # Check blocked regex patterns
  for pattern in "${BLOCKED_PATTERNS[@]+"${BLOCKED_PATTERNS[@]}"}"; do
    if echo "$cmd" | grep -qE "$pattern" 2>/dev/null; then
      return 0
    fi
  done

  # Check restricted prefixes
  for prefix in "${RESTRICTED_PREFIXES[@]+"${RESTRICTED_PREFIXES[@]}"}"; do
    if [[ "$cmd" == "$prefix"* ]]; then
      return 0
    fi
  done

  return 1
}

# Log a command execution
log_command() {
  local timestamp
  timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "${timestamp} ${1}: ${2}" >> "$SHELL_HISTORY_FILE" 2>/dev/null || true
}

# Main shell loop
main() {
  load_blocklist

  local blocked_count=${#HARD_BLOCKED[@]}
  local pattern_count=${#BLOCKED_PATTERNS[@]}
  local prefix_count=${#RESTRICTED_PREFIXES[@]}

  echo -e "${DIM}portlama-shell — restricted remote shell${RESET}"
  if [[ $((blocked_count + pattern_count + prefix_count)) -gt 0 ]]; then
    echo -e "${DIM}Blocklist loaded: ${blocked_count} exact, ${pattern_count} patterns, ${prefix_count} prefixes${RESET}"
  fi
  echo ""

  # Use bash as the underlying shell with a custom prompt
  export PS1="\\[${YELLOW}\\]portlama\\[${RESET}\\]:\\w\\$ "

  while true; do
    # Read command with the custom prompt
    if ! read -rep "$(echo -e "${YELLOW}portlama${RESET}:${PWD}\$ ")" cmd; then
      # EOF — exit gracefully
      echo ""
      break
    fi

    # Skip empty commands
    if [[ -z "$(echo "$cmd" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')" ]]; then
      continue
    fi

    # Add to bash history
    history -s "$cmd"

    # Check blocklist
    if is_blocked "$cmd"; then
      echo -e "${RED}BLOCKED:${RESET} This command is not allowed in remote shell sessions."
      echo -e "${DIM}Command: ${cmd}${RESET}"
      log_command "BLOCKED" "$cmd"
      continue
    fi

    # Execute the command
    log_command "EXEC" "$cmd"
    eval "$cmd"
  done
}

main "$@"
