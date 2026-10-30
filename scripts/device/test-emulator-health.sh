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
  "shell getprop persist.sys.locale") echo vi-VN ;;
  "shell pidof system_server")
    # DIE_AFTER_SETTLE: the framework restart killed the device, once.
    if [ -f "$WORK/die-on-settle" ]; then rm -f "$WORK/die-on-settle" "$WORK/healthy"; exit 1; fi
    # PID_FILE: a list of pids, consumed one per call; the last one stays.
    if [ -s "$WORK/pids" ]; then head -1 "$WORK/pids"; [ "$(wc -l < "$WORK/pids")" -gt 1 ] && sed -i '1d' "$WORK/pids"; else echo 100; fi
    ;;
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
export HEALTH_TIMEOUT=1 HEALTH_POLL=1 AVD_NAME=test EMULATOR_OPTIONS="-no-window -change-locale vi-VN" SETTLE_TIMEOUT=2 SETTLE_STABLE=2
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
check "retry: boots the same AVD with the same options, wiped" 'grep -q -- "-avd test -no-window -change-locale vi-VN -wipe-data" "$WORK/emulator-calls"'
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

# 4. The framework restarts during the wait: the pid must then hold still for a whole window.
reset_case
: > "$WORK/healthy"
printf '100\n200\n200\n200\n200\n' > "$WORK/pids"
started=$SECONDS
ensure_healthy; rc=$?
check "restart: returns 0, no reboot" '[ "$rc" = 0 ] && [ ! -f "$WORK/emulator-calls" ]'
check "restart: the window starts again after the new pid" '[ $((SECONDS - started)) -ge 3 ]'
rm -f "$WORK/pids"

# 5. The device dies in that restart: the health check after it catches it, one reboot.
reset_case
: > "$WORK/healthy"; : > "$WORK/die-on-settle"
export HEAL_ON_BOOT=1
ensure_healthy; rc=$?
unset HEAL_ON_BOOT
sleep 1
check "death in the restart: recovered by the one reboot" '[ "$rc" = 0 ] && [ "$INFRA_RETRIES" = 1 ] && [ "$(wc -l < "$WORK/emulator-calls")" = 1 ]'

# 6. Without -change-locale nothing waits.
reset_case
: > "$WORK/healthy"
EMULATOR_OPTIONS="-no-window"
ensure_healthy; rc=$?
check "no boot locale: no pid polling" '[ "$rc" = 0 ] && ! grep -q "pidof system_server" "$WORK/adb-calls"'

[ "$fails" = 0 ] && echo "EMULATOR HEALTH TESTS PASSED" || echo "EMULATOR HEALTH TESTS FAILED"
exit "$fails"
