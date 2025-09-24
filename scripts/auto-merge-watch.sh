#!/usr/bin/env bash
set -euo pipefail

# Auto-merge MERGEABLE PRs on a loop.
# - Squash merges
# - Deletes head branch
# - Skips drafts/conflicts

INTERVAL_SECONDS=${INTERVAL_SECONDS:-60}
LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/auto-merge.log"

echo "[auto-merge] starting at $(date -Iseconds)" | tee -a "$LOG_FILE"

while true; do
  start=$(date +%s)
  echo "[auto-merge] cycle start $(date -Iseconds)" | tee -a "$LOG_FILE"

  mapfile -t prs < <(gh pr list --state open \
    --json number,isDraft,mergeable,mergeStateStatus,title \
    --jq '.[] | select(.isDraft==false and .mergeable=="MERGEABLE") | "\(.number)\t\(.title)"') || true

  if [ ${#prs[@]} -gt 0 ]; then
    for line in "${prs[@]}"; do
      n=$(echo "$line" | cut -f1)
      t=$(echo "$line" | cut -f2-)
      echo "[auto-merge] merging #$n - $t" | tee -a "$LOG_FILE"
      if gh pr merge "$n" --squash --delete-branch; then
        echo "[auto-merge] merged #$n" | tee -a "$LOG_FILE"
      else
        echo "[auto-merge] merge failed for #$n, will retry on next cycle" | tee -a "$LOG_FILE"
      fi
    done
  else
    echo "[auto-merge] no mergeable PRs" | tee -a "$LOG_FILE"
  fi

  # Sleep to next interval
  end=$(date +%s)
  elapsed=$(( end - start ))
  sleep_for=$(( INTERVAL_SECONDS - elapsed ))
  [ $sleep_for -lt 5 ] && sleep_for=5
  sleep $sleep_for || true
done

