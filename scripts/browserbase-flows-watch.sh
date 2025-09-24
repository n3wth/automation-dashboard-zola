#!/usr/bin/env bash
set -euo pipefail

# Periodically run rich Browserbase flows and file/update a monitoring issue on failure.

LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/browserbase-flows.log"
INTERVAL_SECONDS=${INTERVAL_SECONDS:-600}

# Engine alias: c (OpenAI), gm (Gemini), cc (Claude)
ENGINE=${RUNNER_ENGINE:-gm}

# Load .env.local each cycle so env changes apply
load_env() {
  if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
}

ensure_label() { gh label list --limit 200 | cut -f1 | rg -q '^monitoring$' || gh label create monitoring -d "Automated monitoring and smoke test failures" -c "#fbca04" || true; }

echo "[flows-watch] starting at $(date -Iseconds) engine=$ENGINE" | tee -a "$LOG_FILE"
ensure_label || true

while true; do
  load_env
  echo "[flows-watch] cycle $(date -Iseconds) with engine=$ENGINE" | tee -a "$LOG_FILE"
  RUNNER_ENGINE="$ENGINE" node scripts/browserbase-flows.js && echo "[flows-watch] OK" | tee -a "$LOG_FILE"
  if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "[flows-watch] FAIL -> GitHub issue" | tee -a "$LOG_FILE"
    ts=$(date -Iseconds)
    title="Monitoring: Browserbase flows failed at $ts ($ENGINE)"
    body=$(printf "Automated Browserbase flows failed at %s using engine=%s.\nLogs: %s\n" "$ts" "$ENGINE" "$LOG_FILE")
    existing=$(gh issue list --state open --label monitoring --search "flows failed" --json number --jq '.[0].number' || true)
    if [ -n "${existing:-}" ]; then gh issue comment "$existing" --body "$body" || true; else gh issue create --title "$title" --body "$body" --label bug --label monitoring || true; fi
  fi
  sleep "$INTERVAL_SECONDS"
done

