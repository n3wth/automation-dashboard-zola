#!/usr/bin/env bash
set -euo pipefail

# Aggressively rebase conflicted PRs onto main, resolve conflicts with policy, test, then squash-merge.
# Policy:
# - CHANGELOG.md: prefer main ("theirs")
# - components/ui/** and components/common/**: prefer PR branch ("ours") to keep UI intent
# - All other conflicts: prefer main ("theirs")
# If tests fail, push rebase anyway but skip merge and leave a comment.

INTERVAL_SECONDS=${INTERVAL_SECONDS:-600}
LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/aggressive-rebase.log"

echo "[aggr] starting at $(date -Iseconds)" | tee -a "$LOG_FILE"

comment_failure() {
  local pr=$1; shift
  local msg=$*
  gh pr comment "$pr" --body "Automated aggressive rebase attempted. Result: $msg" >/dev/null 2>&1 || true
}

process_pr() {
  local pr=$1
  local head; head=$(gh pr view "$pr" --json headRefName --jq .headRefName)
  local base; base=$(gh pr view "$pr" --json baseRefName --jq .baseRefName)
  echo "[aggr] PR #$pr ($head -> $base)" | tee -a "$LOG_FILE"

  # If already mergeable, merge
  local ms; ms=$(gh pr view "$pr" --json mergeable,mergeStateStatus --jq '{m:.mergeable,s:.mergeStateStatus}')
  if echo "$ms" | rg -q 'MERGEABLE|CLEAN|UNSTABLE'; then
    echo "[aggr] mergeable; merging #$pr" | tee -a "$LOG_FILE"
    gh pr merge "$pr" --squash --delete-branch >/dev/null 2>&1 && return 0
  fi

  # Checkout and rebase
  if ! gh pr checkout "$pr" >/dev/null 2>&1; then
    echo "[aggr] checkout failed for #$pr" | tee -a "$LOG_FILE"
    return 1
  fi
  git fetch origin "$base" >/dev/null 2>&1 || true
  if git rebase "origin/$base"; then
    echo "[aggr] rebase clean for #$pr" | tee -a "$LOG_FILE"
  else
    echo "[aggr] conflicts; applying policy for #$pr" | tee -a "$LOG_FILE"
    # Loop over conflicted files
    while git status --porcelain | rg -q '^UU '; do
      mapfile -t files < <(git status --porcelain | rg '^UU ' | awk '{print $2}')
      for f in "${files[@]}"; do
        case "$f" in
          CHANGELOG.md)
            git checkout --theirs -- "$f" || true;
            ;;
          components/ui/*|components/common/*)
            git checkout --ours -- "$f" || true;
            ;;
          *)
            git checkout --theirs -- "$f" || true;
            ;;
        esac
        git add -- "$f" || true
      done
      if git rebase --continue; then
        echo "[aggr] continued after policy resolution" | tee -a "$LOG_FILE"
      else
        echo "[aggr] rebase still failing; aborting #$pr" | tee -a "$LOG_FILE"
        git rebase --abort || true
        comment_failure "$pr" "rebase aborted due to complex conflicts. Please resolve manually."
        return 1
      fi
    done
  fi

  # Push updated branch
  git push -f origin HEAD >/dev/null 2>&1 || true

  # Run tests
  echo "[aggr] running tests for #$pr" | tee -a "$LOG_FILE"
  set +e
  npm run -s test:ci > "$LOG_DIR/aggr-pr-$pr.test.out" 2>&1
  code=$?
  set -e
  if [ $code -ne 0 ]; then
    echo "[aggr] tests failed for #$pr (code $code)" | tee -a "$LOG_FILE"
    comment_failure "$pr" "tests failed after rebase; see logs/aggr-pr-$pr.test.out"
    return 1
  fi

  # Merge
  echo "[aggr] merging #$pr" | tee -a "$LOG_FILE"
  gh pr merge "$pr" --squash --delete-branch >/dev/null 2>&1 || {
    comment_failure "$pr" "merge failed; please check required checks or protections"
    return 1
  }
}

while true; do
  echo "[aggr] cycle $(date -Iseconds)" | tee -a "$LOG_FILE"
  mapfile -t prs < <(gh pr list --state open --json number,mergeable,mergeStateStatus \
    --jq '.[] | select(.mergeable=="CONFLICTING" or .mergeStateStatus=="DIRTY") | .number')
  for pr in "${prs[@]:-}"; do
    process_pr "$pr" || true
  done
  sleep "$INTERVAL_SECONDS"
done

