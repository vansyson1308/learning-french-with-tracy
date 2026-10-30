# shellcheck shell=bash
# Emulator health for scripts/device/acceptance.sh, sourced so the retry path
# can be tested without an emulator (scripts/device/test-emulator-health.sh).
#
# API 30 emulators died at boot on three runs in a row (2026-10-30: "Unable to
# connect to adb daemon", then port 5554 refused) and every later flow failed
# with no app involved. Before the app is installed the device must answer:
# adb state, sys.boot_completed and the package manager. If it does not, the
# emulator is killed, wiped and booted again exactly once, and the report says
# so ("infra retry"). A second failure fails the run: it is never hidden.
#
# Needs: adb_t (flow-runner.sh).
# Env:   EMULATOR_OPTIONS   the options the emulator was booted with (workflow env)
#        AVD_NAME=test      the emulator-runner's default AVD
#        HEALTH_TIMEOUT=120 seconds to wait for a healthy device, per boot
#        HEALTH_POLL=5      seconds between checks

AVD_NAME=${AVD_NAME:-test}
HEALTH_TIMEOUT=${HEALTH_TIMEOUT:-120}
HEALTH_POLL=${HEALTH_POLL:-5}
INFRA_RETRIES=0
INFRA_REASON=""

# Empty when healthy, else what is wrong.
device_problem() {
  local state
  state=$(adb_t get-state 2>/dev/null | tr -d '\r')
  [ "$state" = device ] || { echo "adb state '${state:-none}'"; return 0; }
  [ "$(adb_t shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] || { echo "sys.boot_completed not 1"; return 0; }
  adb_t shell pm path android > /dev/null 2>&1 || echo "package manager not answering"
}

wait_healthy() {
  local waited=0 problem
  while :; do
    problem=$(device_problem)
    if [ -z "$problem" ]; then INFRA_REASON=""; return 0; fi
    INFRA_REASON=$problem
    [ "$waited" -ge "$HEALTH_TIMEOUT" ] && return 1
    sleep "$HEALTH_POLL"
    waited=$((waited + HEALTH_POLL))
  done
}

reboot_emulator() {
  adb_t emu kill > /dev/null 2>&1
  if command -v pkill > /dev/null; then pkill -f "qemu-system" || true; fi
  sleep "$HEALTH_POLL"
  # shellcheck disable=SC2086  # EMULATOR_OPTIONS is a word list.
  nohup "${ANDROID_HOME:-}/emulator/emulator" -avd "$AVD_NAME" ${EMULATOR_OPTIONS:-} -wipe-data > "${OUT:-.}/logs/emulator-reboot.log" 2>&1 &
  timeout 120 adb wait-for-device > /dev/null 2>&1
}

# 0 when the device is healthy, at most after one wipe and reboot.
ensure_healthy() {
  wait_healthy && return 0
  local first=$INFRA_REASON
  INFRA_RETRIES=$((INFRA_RETRIES + 1))
  echo "infra retry: emulator unhealthy ($first); kill, wipe, boot again" >&2
  reboot_emulator
  if wait_healthy; then
    INFRA_REASON="first boot: $first"
    # The emulator-runner set these once, on the boot that died.
    adb_t shell settings put global window_animation_scale 0.0 > /dev/null 2>&1
    adb_t shell settings put global transition_animation_scale 0.0 > /dev/null 2>&1
    adb_t shell settings put global animator_duration_scale 0.0 > /dev/null 2>&1
    return 0
  fi
  INFRA_REASON="first boot: $first; after one retry: $INFRA_REASON"
  return 1
}

# The report row every run carries, so the retry count can be tracked.
record_infra() {
  if [ "$INFRA_RETRIES" = 0 ]; then
    record "emulator health" PASS "0 infra retries"
  else
    record "emulator health" INFO "infra retry, $INFRA_RETRIES infra retries: emulator wiped and rebooted ($INFRA_REASON)"
  fi
}
