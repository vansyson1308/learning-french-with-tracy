#!/usr/bin/env bash
# Bot-commit gate: the only way a workflow may commit to the repository.
#
# Commits pushed with the workflow token never trigger CI, so a data
# workflow that commits generated output without the gates turns `main` red
# silently (2026-10-14: three audio canary commits changed ATTRIBUTIONS.md
# and added reports without re-blessing the compile golden). This script
# makes every bot commit pass the same gates a pull request does:
#
#   1. golden: `golden.ts --check`; on a difference, re-bless with a reason
#      that names the workflow, language, mode and run id, then re-check;
#   2. `bun run test`, `bun run content:check`, `bun run audio:check`.
#
# Any failure exits non-zero BEFORE `git commit`: nothing is committed.
# On a rejected push the commit is rebased onto the moved branch and the
# gate runs again (a rebase can make the blessed manifest stale). Uncommitted
# run leftovers are stashed first, and a conflict confined to the golden
# files takes the branch's version (the gate re-blesses it); any other
# conflicting rebase aborts and fails — re-dispatch the run instead.
#
# Usage:
#   scripts/ci/bot-commit.sh --branch <branch> --message <file> --reason "<workflow> <lang> <mode> run <id>" -- <path>...
set -euo pipefail

BRANCH=""
MESSAGE=""
REASON=""
PATHS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --branch) BRANCH="$2"; shift 2 ;;
    --message) MESSAGE="$2"; shift 2 ;;
    --reason) REASON="$2"; shift 2 ;;
    --) shift; PATHS=("$@"); break ;;
    *) echo "bot-commit: unknown argument $1" >&2; exit 2 ;;
  esac
done
if [ -z "$BRANCH" ] || [ -z "$MESSAGE" ] || [ -z "$REASON" ] || [ ${#PATHS[@]} -eq 0 ]; then
  echo "usage: bot-commit.sh --branch <b> --message <file> --reason <text> -- <path>..." >&2
  exit 2
fi
[ -f "$MESSAGE" ] || { echo "bot-commit: message file $MESSAGE missing" >&2; exit 2; }

GOLDEN_PATHS=(scripts/__tests__/golden src/lib/__tests__/golden)

stage() {
  local p
  for p in "${PATHS[@]}" "${GOLDEN_PATHS[@]}"; do
    if [ -e "$p" ]; then git add -A -- "$p"; fi
  done
}

gate() {
  local why="$1"
  if bun scripts/golden.ts --check; then
    echo "bot-commit: goldens unchanged"
  else
    echo "bot-commit: re-blessing goldens — $why"
    bun scripts/golden.ts --update --reason "$why"
    bun scripts/golden.ts --check
  fi
  bun run test
  bun run content:check
  bun run audio:check
}

stage
if git diff --cached --quiet; then
  echo "bot-commit: nothing to commit"
  exit 0
fi
gate "$REASON"
stage
git commit -F "$MESSAGE"

for attempt in 1 2 3; do
  if git push origin "HEAD:$BRANCH"; then
    echo "bot-commit: pushed $(git rev-parse --short HEAD) to $BRANCH"
    exit 0
  fi
  echo "bot-commit: push rejected (attempt $attempt) — rebasing onto origin/$BRANCH and re-running the gate"
  git fetch origin "$BRANCH"
  # Files the run touched but does not commit (outside PATHS) would block the
  # rebase; they are run leftovers, so set them aside.
  git stash push --quiet -m "bot-commit leftovers" || true
  if ! git rebase "origin/$BRANCH"; then
    # A golden manifest/CHANGELOG conflict is expected when the branch moved:
    # take the branch's goldens and let the gate below re-bless them.
    conflicted="$(git diff --name-only --diff-filter=U)"
    if [ -n "$conflicted" ] && ! printf '%s\n' "$conflicted" | grep -qvE '^(scripts/__tests__/golden|src/lib/__tests__/golden)/'; then
      printf '%s\n' "$conflicted" | while read -r f; do git checkout --ours -- "$f" && git add -- "$f"; done
      GIT_EDITOR=true git rebase --continue || { git rebase --abort || true; echo "::error::bot-commit: rebase could not continue — re-dispatch the run"; exit 1; }
    else
      git rebase --abort || true
      echo "::error::bot-commit: $BRANCH moved with conflicting changes — nothing pushed; re-dispatch the run"
      exit 1
    fi
  fi
  gate "$REASON (after rebase onto $(git rev-parse --short "origin/$BRANCH"))"
  stage
  if ! git diff --cached --quiet; then git commit --amend --no-edit; fi
  sleep $((attempt * 5))
done
echo "::error::bot-commit: push failed after 3 attempts"
exit 1
