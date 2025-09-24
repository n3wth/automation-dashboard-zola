#!/usr/bin/env bash
set -euo pipefail

# Run tests, capture failures, and file/update a GitHub issue.
# - Uses labels: bug, test-failure
# - De-duplicates by SHA1 of failing output

LOG_DIR=${LOG_DIR:-"logs"}
mkdir -p "$LOG_DIR"
OUT_FILE="$LOG_DIR/test-latest.out"
SUMMARY_FILE="$LOG_DIR/test-summary.txt"

run_tests() {
  rm -f "$OUT_FILE" "$SUMMARY_FILE"
  echo "[tests] running at $(date -Iseconds)" | tee -a "$LOG_DIR/test-file-issues.log"
  set +e
  npm run -s test:ci | tee "$OUT_FILE"
  code=$?
  set -e
  if [ $code -eq 0 ]; then
    echo "[tests] PASS" | tee -a "$LOG_DIR/test-file-issues.log"
    return 0
  fi

  # Extract last 300 lines for brevity
  tail -n 300 "$OUT_FILE" > "$SUMMARY_FILE"
  sha=$(shasum "$SUMMARY_FILE" | awk '{print $1}')
  title="Test failure: $(date +%Y-%m-%d) [$sha]"
  body=$(printf "Automated test run detected failures.\n\nSHA: %s\n\n<details>\n<summary>Last 300 lines</summary>\n\n\n%s\n\n</details>\n" "$sha" "$(sed 's/\r$//' "$SUMMARY_FILE")")

  # Search for existing issue with this SHA in body
  existing=$(gh issue list --state open --search "$sha in:body" --json number --jq '.[0].number' || true)
  if [ -n "${existing:-}" ]; then
    echo "[tests] updating existing issue #$existing" | tee -a "$LOG_DIR/test-file-issues.log"
    gh issue comment "$existing" --body "New occurrence at $(date -Iseconds). See logs above."
  else
    echo "[tests] creating new issue" | tee -a "$LOG_DIR/test-file-issues.log"
    gh issue create --title "$title" --body "$body" --label bug --label test-failure || true
  fi
  return 1
}

if [[ "${1:-}" == "--watch" ]]; then
  INTERVAL=${INTERVAL_SECONDS:-600}
  while true; do
    run_tests || true
    sleep "$INTERVAL"
  done
else
  run_tests
fi

