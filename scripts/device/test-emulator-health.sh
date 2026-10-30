#!/usr/bin/env bash
# The retry path of scripts/device/emulator-health.sh, without an emulator: a
# healthy device costs no reboot; a dead one gets exactly one wipe and reboot,
# and the report says so; a device still dead after that fails.
# Run by scripts/__tests__/device-emulator-health.test.ts (Linux CI).
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/bin" "$WORK/sdk/emulator" "$WORK/logs"

# adb stub: healthy when $WORK/healthy exists.
cat > "$WORK/bin/adb" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$WORK/adb-calls"
if [ ! -f "$WORK/healthy" ]; then
  case "$*" in "wait-for-device") exit 0 ;; *) exit 1 ;; esac
fi
case "$*" in
  "get-state") echo device ;;
  "shell getprop sys.boot_completed") echo 1 ;;
esac
exit 0
EOF
# emulator stub: records its arguments; heals the device when HEAL_ON_BOOT is set.
cat > "$WORK/sdk/emulator/emulator" <<'EOF'
#!/usr/bin/env bash
echo "$*" >> "$WORK/emulator-calls"
[ -n "${HEAL_ON_BOOT:-}" ] && : > "$WORK/healthy"
exit 0
EOF
chmod +x "$WORK/bin/adb" "$WORK/sdk/emulator/emulator"

export PATH="$WORK/bin:$PATH" WORK ANDROID_HOME="$WORK/sdk"
export HEALTH_TIMEOUT=1 HEALTH_POLL=1 AVD_NAME=test EMULATOR_OPTIONS="-no-window -noaudio"
OUT=$WORK
REPORT="$WORK/REPORT.md"
fails=0
check() { if eval "$2"; then echo "ok    $1"; else echo "FAIL  $1"; fails=1; fi; }
reset_case() { rm -f "$WORK/healthy" "$WORK/emulator-calls" "$WORK/adb-calls"; : > "$REPORT"; INFRA_RETRIES=0; INFRA_REASON=""; FAILED=0; }

# shellcheck source=flow-runner.sh
. "$HERE/flow-runner.sh"
# shellcheck source=emulator-health.sh
. "$HERE/emulator-health.sh"

# 1. Healthy: no reboot, and the report still carries the count.
reset_case
: > "$WORK/healthy"
ensure_healthy; rc=$?
record_infra > /dev/null
check "healthy: returns 0" '[ "$rc" = 0 ]'
check "healthy: no reboot" '[ ! -f "$WORK/emulator-calls" ] && ! grep -q "emu kill" "$WORK/adb-calls"'
check "healthy: the report says 0 infra retries" 'grep -q "| emulator health | PASS | 0 infra retries" "$REPORT"'

# 2. Dead, healed by the reboot: exactly one wipe, and the report says "infra retry".
reset_case
export HEAL_ON_BOOT=1
ensure_healthy; rc=$?
unset HEAL_ON_BOOT
sleep 1
record_infra > /dev/null
check "retry: returns 0" '[ "$rc" = 0 ]'
check "retry: the emulator was killed" 'grep -q "emu kill" "$WORK/adb-calls"'
check "retry: exactly one boot" '[ "$(wc -l < "$WORK/emulator-calls")" = 1 ]'
check "retry: boots the same AVD with the same options, wiped" 'grep -q -- "-avd test -no-window -noaudio -wipe-data" "$WORK/emulator-calls"'
check "retry: the report says infra retry and the count" 'grep -q "| emulator health | INFO | infra retry, 1 infra retries" "$REPORT"'
check "retry: the run is not failed by it" '[ "$FAILED" = 0 ]'

# 3. Dead after the reboot too: fails, still one boot.
reset_case
ensure_healthy; rc=$?
sleep 1
check "dead twice: returns non-zero" '[ "$rc" != 0 ]'
check "dead twice: exactly one boot" '[ "$(wc -l < "$WORK/emulator-calls")" = 1 ]'
check "dead twice: the reason names both boots" 'case "$INFRA_REASON" in *"first boot:"*"after one retry:"*) true ;; *) false ;; esac'
check "dead twice: the count is 1" '[ "$INFRA_RETRIES" = 1 ]'

# 4. The boot step (the locale restart) runs on a healthy device, once.
reset_case
: > "$WORK/healthy"
prepare_ok() { echo prepared >> "$WORK/prepare-calls"; return 0; }
BOOT_PREPARE=prepare_ok
rm -f "$WORK/prepare-calls"
ensure_healthy; rc=$?
check "prepare: returns 0, no reboot" '[ "$rc" = 0 ] && [ ! -f "$WORK/emulator-calls" ]'
check "prepare: ran once" '[ "$(wc -l < "$WORK/prepare-calls")" = 1 ]'

# 5. The device dies in that step: one reboot, the step runs again, the run goes on.
reset_case
: > "$WORK/healthy"
prepare_dies_once() {
  if [ ! -f "$WORK/died" ]; then : > "$WORK/died"; rm -f "$WORK/healthy"; return 1; fi
  return 0
}
BOOT_PREPARE=prepare_dies_once
rm -f "$WORK/died"
export HEAL_ON_BOOT=1
ensure_healthy; rc=$?
unset HEAL_ON_BOOT
sleep 1
check "death in the step: recovered by the one reboot" '[ "$rc" = 0 ] && [ "$INFRA_RETRIES" = 1 ] && [ "$(wc -l < "$WORK/emulator-calls")" = 1 ]'
check "death in the step: the reason names the step" 'case "$INFRA_REASON" in *"prepare_dies_once failed"*) true ;; *) false ;; esac'

# 6. The step fails on both boots: the run fails.
reset_case
: > "$WORK/healthy"
prepare_fails() { return 1; }
BOOT_PREPARE=prepare_fails
export HEAL_ON_BOOT=1
ensure_healthy; rc=$?
unset HEAL_ON_BOOT
sleep 1
check "step fails twice: returns non-zero after one boot" '[ "$rc" != 0 ] && [ "$(wc -l < "$WORK/emulator-calls")" = 1 ]'
BOOT_PREPARE=""

[ "$fails" = 0 ] && echo "EMULATOR HEALTH TESTS PASSED" || echo "EMULATOR HEALTH TESTS FAILED"
exit "$fails"
