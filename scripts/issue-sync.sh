#!/usr/bin/env bash
set -euo pipefail

# Close issues referenced by recently merged PRs.
# - Uses closing keywords or issue number in PR title like (#123)

STATE_DIR=${STATE_DIR:-".automation"}
LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$STATE_DIR" "$LOG_DIR"
STATE_FILE="$STATE_DIR/last_issue_sync"
LOG_FILE="$LOG_DIR/issue-sync.log"

now=$(date -Iseconds)
echo "[issue-sync] start $now" | tee -a "$LOG_FILE"

since=$(date -u -v-1d -Iseconds 2>/dev/null || true)
if [ -f "$STATE_FILE" ]; then since=$(cat "$STATE_FILE"); fi
[ -z "${since:-}" ] && since=$(date -u -d '1 day ago' -Iseconds 2>/dev/null || date -u -Iseconds)

echo "[issue-sync] since $since" | tee -a "$LOG_FILE"

mapfile -t prs < <(gh pr list --state merged --search "updated:>$since" \
  --json number,title,closingIssuesReferences \
  --jq '.[] | {n:.number,t:.title,closing:[.closingIssuesReferences[]?.number]} | @base64') || true

close_issue() {
  local num=$1
  local pr=$2
  local is_open
  is_open=$(gh issue view "$num" --json state --jq .state 2>/dev/null || echo "CLOSED")
  if [ "$is_open" = "OPEN" ]; then
    gh issue comment "$num" --body "Closed by PR #$pr."
    gh issue close "$num" --reason completed
    echo "[issue-sync] closed #$num via PR #$pr" | tee -a "$LOG_FILE"
  else
    echo "[issue-sync] issue #$num already $is_open" | tee -a "$LOG_FILE"
  fi
}

for row in "${prs[@]}"; do
  obj=$(echo "$row" | base64 --decode)
  n=$(echo "$obj" | jq -r '.n')
  t=$(echo "$obj" | jq -r '.t')
  mapfile -t closings < <(echo "$obj" | jq -r '.closing[]?')

  if [ ${#closings[@]} -gt 0 ]; then
    for i in "${closings[@]}"; do close_issue "$i" "$n"; done
  fi

  # Also detect (#123) in title
  nums=$(echo "$t" | rg -o '#[0-9]+' -N | sed 's/#//g' || true)
  if [ -n "$nums" ]; then
    while read -r id; do [ -n "$id" ] && close_issue "$id" "$n"; done <<<"$nums"
  fi
done

echo "$now" > "$STATE_FILE"
echo "[issue-sync] complete $(date -Iseconds)" | tee -a "$LOG_FILE"

if [[ "${1:-}" == "--watch" ]]; then
  INTERVAL=${INTERVAL_SECONDS:-300}
  while true; do
    "$0"
    sleep "$INTERVAL"
  done
fi

