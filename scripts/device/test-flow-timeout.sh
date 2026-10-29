#!/usr/bin/env bash
# The hang path of scripts/device/flow-runner.sh, without an emulator: a
# fake `maestro` that never returns must end as FAIL (timeout) within
# FLOW_TIMEOUT + 30 s per attempt and leave a .hang/ diagnostics folder;
# one that hangs once must pass on the retry and say so. Run by
# scripts/__tests__/device-flow-timeout.test.ts (Linux CI).
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/bin" "$WORK/home"

# adb stub: answers every call, prints a device for `devices -l`.
cat > "$WORK/bin/adb" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$WORK/adb-calls"
case "$*" in
  "devices -l") printf 'List of devices attached\nemulator-5554 device product:fake\n' ;;
  "exec-out screencap -p") printf 'PNG' ;;
esac
exit 0
EOF
# maestro stub: hangs forever, or only on its first call when HANG_ONCE is set.
cat > "$WORK/bin/fake-maestro" <<'EOF'
#!/usr/bin/env bash
count_file="$WORK/calls"
n=$(( $(cat "$count_file" 2>/dev/null || echo 0) + 1 )); echo "$n" > "$count_file"
echo "fake maestro call $n: $*"
if [ -z "${HANG_ONCE:-}" ] || [ "$n" = 1 ]; then exec sleep 3600; fi
exit 0
EOF
chmod +x "$WORK/bin/adb" "$WORK/bin/fake-maestro"

export PATH="$WORK/bin:$PATH" HOME="$WORK/home" WORK
export FLOW_TIMEOUT=2 FLOW_KILL_AFTER=2s
MAESTRO="$WORK/bin/fake-maestro"
fails=0
check() { if eval "$2"; then echo "ok    $1"; else echo "FAIL  $1"; fails=1; fi; }

setup_case() {
  OUT="$WORK/out-$1"; REPORT="$OUT/REPORT.md"; FAILED=0; RUNS=0
  rm -f "$WORK/calls"
  mkdir -p "$OUT/flows" "$OUT/logs" "$OUT/shots" "$OUT/maestro"
  : > "$REPORT"; : > "$OUT/flows/hang.yaml"
}

# shellcheck source=flow-runner.sh
. "$HERE/flow-runner.sh"

# 1. Hangs on both attempts → FAIL (timeout), diagnostics, bounded time.
setup_case always
started=$SECONDS
flow "lesson de-en" hang.yaml > /dev/null; rc=$?
elapsed=$((SECONDS - started))
check "flow returns non-zero" '[ "$rc" != 0 ]'
check "the run is marked failed" '[ "$FAILED" = 1 ]'
check "the row says FAIL (timeout)" 'grep -q "| lesson de-en | FAIL | timeout after 2s" "$REPORT"'
check "each attempt ends within FLOW_TIMEOUT + 30 s" '[ "$elapsed" -le $(( 2 * (FLOW_TIMEOUT + 30) )) ]'
check "hang diagnostics folder" '[ -s "$OUT/logs/lesson_de-en.hang/adb-devices.txt" ] && [ -f "$OUT/logs/lesson_de-en.hang/activity-top.txt" ] && [ -s "$OUT/logs/lesson_de-en.hang/screen.png" ]'
check "retry diagnostics folder" '[ -d "$OUT/logs/lesson_de-en.retry.hang" ]'
check "maestro pinned to the device" 'grep -q -- "--device emulator-5554 test" "$OUT/logs/lesson_de-en.log"'
check "a hang uninstalls the Maestro driver apps before the retry" 'grep -q "^uninstall dev.mobile.maestro.test$" "$WORK/adb-calls" && grep -q "^uninstall dev.mobile.maestro$" "$WORK/adb-calls"'

# 2. Hangs once → the retry passes, and the row keeps the first failure.
setup_case once
export HANG_ONCE=1
flow "lesson de-en" hang.yaml > /dev/null; rc=$?
unset HANG_ONCE
check "retry after a hang passes" '[ "$rc" = 0 ] && [ "$FAILED" = 0 ]'
check "the row names the timeout" 'grep -q "| PASS | .*passed on retry; first failure: timeout after 2s" "$REPORT"'
check "diagnostics kept for the first hang" '[ -d "$OUT/logs/lesson_de-en.hang" ]'

echo "elapsed for the double hang: ${elapsed}s"
[ "$fails" = 0 ] && echo "FLOW TIMEOUT TESTS PASSED" || echo "FLOW TIMEOUT TESTS FAILED"
exit "$fails"
