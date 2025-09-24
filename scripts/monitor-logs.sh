#!/usr/bin/env bash
set -euo pipefail

# Monitor repo logs (./logs/*.log) for ERROR/FAIL patterns and file/update a GitHub issue.

LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
OUT="$LOG_DIR/monitor-logs.log"
INTERVAL_SECONDS=${INTERVAL_SECONDS:-300}

ensure_label() { gh label list --limit 200 | cut -f1 | rg -q '^monitoring$' || gh label create monitoring -d "Automated monitoring and smoke test failures" -c "#fbca04" || true; }

echo "[logmon] starting at $(date -Iseconds)" | tee -a "$OUT"
ensure_label || true

scan_once() {
  local ts; ts=$(date -Iseconds)
  local matches
  matches=$(rg -n "\b(ERROR|FAIL|FATAL)\b" logs/*.log 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "[logmon] issues detected" | tee -a "$OUT"
    local title="Monitoring: log errors detected at $ts"
    local body=$(printf "Automated log monitor detected issues at %s.\n\n<details>\n<summary>Matches</summary>\n\n%s\n\n</details>\n" "$ts" "$matches")
    local existing
    existing=$(gh issue list --state open --label monitoring --search "log errors" --json number --jq '.[0].number' || true)
    if [ -n "${existing:-}" ]; then gh issue comment "$existing" --body "$body" || true; else gh issue create --title "$title" --body "$body" --label bug --label monitoring || true; fi
  else
    echo "[logmon] clean" | tee -a "$OUT"
  fi
}

if [[ "${1:-}" == "--once" ]]; then scan_once; exit 0; fi

while true; do
  scan_once || true
  sleep "$INTERVAL_SECONDS"
done

