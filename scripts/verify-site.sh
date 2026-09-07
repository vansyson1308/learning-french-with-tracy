#!/usr/bin/env bash
# Verify the deployed public site over real HTTPS (run on a GitHub runner or
# any machine with internet access; the automation sandbox cannot reach
# github.io). Exit 1 on any failure. Usage: scripts/verify-site.sh [base-url]
set -u
BASE="${1:-https://vansyson1308.github.io/learning-french-with-tracy}"
EMAIL="$(node -e "process.stdout.write(require('./release/support-contact.json').email || '')" 2>/dev/null || true)"
NAME="Learning French with Tracy"
fail=0
summary=""
check() { # path, required-string...
  local path="$1"; shift
  local url="${BASE}${path}"
  local code="000" body="" attempt=0
  for delay in 0 10 20 40 60 90; do
    sleep "$delay"; attempt=$((attempt+1))
    body="$(curl -sS -L --max-time 30 -w '\n%{http_code}' "$url" 2>/dev/null)" || body=$'\n000'
    code="${body##*$'\n'}"; body="${body%$'\n'*}"
    [ "$code" = "200" ] && break
  done
  local status="PASS" notes=""
  [ "$code" = "200" ] || { status="FAIL"; notes="HTTP $code after $attempt attempt(s)"; }
  case "$url" in https://*) ;; *) status="FAIL"; notes="$notes not https";; esac
  for s in "$@"; do
    grep -qF -- "$s" <<<"$body" || { status="FAIL"; notes="$notes missing:'$s'"; }
  done
  for bad in "Lingo Lessons: Languages" "ahmetdedeler" "com.ahmet.lingo" "openappsstudio.com"; do
    grep -qF -- "$bad" <<<"$body" && { status="FAIL"; notes="$notes stale:'$bad'"; }
  done
  grep -q 'name="viewport"' <<<"$body" || { status="FAIL"; notes="$notes no-viewport"; }
  [ "$status" = "PASS" ] || fail=1
  summary="${summary}| ${path:-/} | $code | $status | ${notes:-—} |"$'\n'
  echo "$status $url ($code) $notes"
}
check "/"          "$NAME"
check "/privacy/"  "$NAME" "Privacy Policy" ${EMAIL:+"$EMAIL"}
check "/support/"  "$NAME" ${EMAIL:+"$EMAIL"}
check "/guide/"    "$NAME" "User guide"
check "/licenses/" "$NAME" "Lingo Lessons"
check "/accessibility/" "$NAME"
check "/release/"  "$NAME"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  { echo "## Public site verification ($BASE)"; echo; echo "| Page | HTTP | Result | Notes |"; echo "|---|---|---|---|"; printf '%s' "$summary"; } >> "$GITHUB_STEP_SUMMARY"
fi
[ "$fail" = 0 ] && echo "site verification PASSED" || { echo "site verification FAILED"; exit 1; }
