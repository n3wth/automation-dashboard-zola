#!/usr/bin/env bash
set -euo pipefail

# Load env from .env.local when present
load_env() {
  if [ -f .env.local ]; then
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
  fi
}

LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/browserbase-smoke.log"

INTERVAL_SECONDS=${INTERVAL_SECONDS:-300}
SMOKE_URL=${SMOKE_URL:-"https://bob.newth.ai"}

echo "[smoke-watch] starting at $(date -Iseconds) for $SMOKE_URL" | tee -a "$LOG_FILE"

while true; do
  load_env
  echo "[smoke-watch] cycle $(date -Iseconds)" | tee -a "$LOG_FILE"
  if node scripts/browserbase-smoke.js; then
    echo "[smoke-watch] OK" | tee -a "$LOG_FILE"
  else
    echo "[smoke-watch] FAIL -> filing/updating GitHub issue" | tee -a "$LOG_FILE"
    ts=$(date -Iseconds)
    title="Monitoring: Browserbase smoke failed at $ts"
    body=$(printf "Automated Browserbase smoke test failed at %s.\n\nSee logs in repo at %s\n" "$ts" "$LOG_FILE")
    # Find existing open monitoring issue
    existing=$(gh issue list --state open --label monitoring --search "Browserbase smoke failed" --json number --jq '.[0].number' || true)
    if [ -n "${existing:-}" ]; then
      gh issue comment "$existing" --body "$body" || true
    else
      gh issue create --title "$title" --body "$body" --label bug --label monitoring || true
    fi
  fi
  sleep "$INTERVAL_SECONDS"
done

