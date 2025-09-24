#!/usr/bin/env bash
set -euo pipefail

# Attempt safe auto-rebases for conflicted PRs.
# Resolves CHANGELOG.md by preferring main; otherwise aborts.

INTERVAL_SECONDS=${INTERVAL_SECONDS:-300}
LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/auto-rebase.log"

echo "[auto-rebase] starting at $(date -Iseconds)" | tee -a "$LOG_FILE"

safe_rebase_and_merge() {
  local pr=$1
  local head
  head=$(gh pr view "$pr" --json headRefName --jq .headRefName)
  local current
  current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

  echo "[auto-rebase] PR #$pr ($head)" | tee -a "$LOG_FILE"

  if ! gh pr checkout "$pr" >/dev/null 2>&1; then
    echo "[auto-rebase] checkout failed for #$pr" | tee -a "$LOG_FILE"
    return 1
  fi

  git fetch origin main >/dev/null 2>&1 || true
  if git rebase origin/main; then
    echo "[auto-rebase] rebase clean; pushing…" | tee -a "$LOG_FILE"
    git push -f origin HEAD >/dev/null 2>&1 || true
  else
    echo "[auto-rebase] conflicts; attempting CHANGELOG-only resolution" | tee -a "$LOG_FILE"
    if git status --porcelain | rg -q '^UU CHANGELOG.md'; then
      git checkout --theirs CHANGELOG.md || true
      git add CHANGELOG.md || true
      if git rebase --continue; then
        echo "[auto-rebase] rebase continued after resolving CHANGELOG; pushing…" | tee -a "$LOG_FILE"
        git push -f origin HEAD >/dev/null 2>&1 || true
      else
        echo "[auto-rebase] rebase still failing; aborting for #$pr" | tee -a "$LOG_FILE"
        git rebase --abort || true
      fi
    else
      git rebase --abort || true
    fi
  fi

  # Try to merge if now mergeable
  local st
  st=$(gh pr view "$pr" --json mergeable,mergeStateStatus --jq '{m:.mergeable,s:.mergeStateStatus}' || echo '{}')
  if echo "$st" | rg -q 'MERGEABLE|CLEAN|UNSTABLE'; then
    echo "[auto-rebase] merging #$pr" | tee -a "$LOG_FILE"
    gh pr merge "$pr" --squash --delete-branch >/dev/null 2>&1 || true
  fi

  git checkout "$current" >/dev/null 2>&1 || true
}

while true; do
  echo "[auto-rebase] cycle $(date -Iseconds)" | tee -a "$LOG_FILE"
  mapfile -t prs < <(gh pr list --state open --json number,mergeable,mergeStateStatus \
    --jq '.[] | select(.mergeable=="CONFLICTING" or .mergeStateStatus=="DIRTY") | .number')
  for pr in "${prs[@]:-}"; do
    safe_rebase_and_merge "$pr" || true
  done
  sleep "$INTERVAL_SECONDS"
done

