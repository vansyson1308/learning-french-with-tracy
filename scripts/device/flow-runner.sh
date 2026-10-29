# shellcheck shell=bash
# Maestro flow runner for scripts/device/acceptance.sh, sourced so the hang
# path can be tested without an emulator (scripts/device/test-flow-timeout.sh).
#
# Expects: OUT (report dir), REPORT (Markdown file), MAESTRO (binary).
# Env:     DEVICE=emulator-5554  pinned with --device on every `maestro test`
#          FLOW_TIMEOUT=600      seconds before one `maestro test` is killed
#          FLOW_KILL_AFTER=30s   SIGKILL grace after the SIGTERM
#
# A hung CLI (seen on API 30: `maestro test` never reached its on-device
# driver) must end as a fast, explicit failure with diagnostics — never as a
# job cancelled hours later by the workflow's timeout-minutes.

DEVICE=${DEVICE:-emulator-5554}
FLOW_TIMEOUT=${FLOW_TIMEOUT:-600}
FLOW_KILL_AFTER=${FLOW_KILL_AFTER:-30s}
FAILED=${FAILED:-0}
RUNS=${RUNS:-0}

# Report names hold ':' and spaces; artifact paths may not (upload-artifact).
slug() { printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_'; }

record() { # name PASS|FAIL|INFO detail
  echo "$2  $1 — $3"
  echo "| $1 | $2 | $3 |" >> "$REPORT"
  [ "$2" = FAIL ] && FAILED=1
  return 0
}

# adb itself can hang on a wedged device; diagnostics must not.
adb_t() { timeout 30 adb "$@" < /dev/null; }

timed_out() { [ "$1" = 124 ] || [ "$1" = 137 ]; }

run_flow() { # log file [extra maestro args]
  local log=$1 file=$2; shift 2
  # Per-run output dir named after the flow file (report names may hold ':').
  RUNS=$((RUNS + 1))
  local dir; dir="$OUT/maestro/$(printf %02d "$RUNS")-${file%.yaml}"
  dismiss_anr < /dev/null
  local rc=0
  timeout --kill-after="$FLOW_KILL_AFTER" "$FLOW_TIMEOUT" \
    "$MAESTRO" --device "$DEVICE" test --no-ansi --test-output-dir "$dir" "$@" "$OUT/flows/$file" \
    < /dev/null > "$log" 2>&1 || rc=$?
  find "$dir" -path '*takeScreenshot*' -name '*.png' -exec cp {} "$OUT/shots/" \; 2>/dev/null
  return $rc
}

# A zygote restart (locale switch) can leave a "System UI isn't responding"
# dialog over every app, sometimes reappearing: tap its locale-independent
# "Wait" button, and "Close app" (System UI restarts) if it keeps coming back.
dismiss_anr() {
  local i button bounds
  for i in 1 2 3 4; do
    adb_t shell dumpsys window | grep -q "mCurrentFocus=.*Application Not Responding" || return 0
    button=aerr_wait; [ "$i" -ge 3 ] && button=aerr_close
    bounds=$(adb_t shell "uiautomator dump /sdcard/lft-ui.xml >/dev/null && cat /sdcard/lft-ui.xml" \
      | grep -o "resource-id=\"android:id/$button\"[^>]*bounds=\"[^\"]*\"" | grep -o 'bounds="[^"]*"' | head -1)
    if [ -n "$bounds" ]; then
      set -- $(echo "$bounds" | tr -c '0-9' ' ')
      adb_t shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
      echo "dismissed a system 'not responding' dialog ($button)" >&2
    fi
    sleep 5
  done
}

# What the device and the CLI looked like when `maestro test` hung.
hang_diagnostics() { # dir
  local dir=$1 cli_log
  mkdir -p "$dir"
  adb_t devices -l > "$dir/adb-devices.txt" 2>&1
  adb_t shell dumpsys activity top > "$dir/activity-top.txt" 2>&1
  adb_t exec-out screencap -p > "$dir/screen.png" 2>/dev/null
  adb_t shell ps -A 2>/dev/null | grep -i maestro > "$dir/ps-maestro.txt"
  cli_log=$(ls -t "$HOME"/.maestro/tests/*/maestro.log 2>/dev/null | head -1)
  [ -n "$cli_log" ] && cp "$cli_log" "$dir/maestro.log"
  return 0
}

# Next `maestro test` reinstalls and reconnects its driver from scratch.
# A force-stop alone was not enough (PR #52, API 30: the CLI hung before its
# first command, and the retry right after failed at once with no output):
# the driver apps are uninstalled, so the retry's CLI installs fresh ones.
reset_driver() {
  adb_t shell am force-stop dev.mobile.maestro > /dev/null 2>&1
  adb_t shell am force-stop dev.mobile.maestro.test > /dev/null 2>&1
  adb_t uninstall dev.mobile.maestro.test > /dev/null 2>&1
  adb_t uninstall dev.mobile.maestro > /dev/null 2>&1
  adb_t forward --remove-all > /dev/null 2>&1
  if command -v pkill > /dev/null; then pkill -f maestro-cli || true; fi
}

failure_reason() { # log rc hang-dir
  if timed_out "$2"; then
    echo "timeout after ${FLOW_TIMEOUT}s (diagnostics: logs/$(basename "$3")/)"
  else
    grep -m1 -iE 'FAILED|Assertion|Error' "$1" | tr '|' '/' | cut -c1-160
  fi
}

# One retry: an emulator hiccup must not fail the gate, but it is never
# hidden — the row says so, and any crash behind it is still counted by
# crash_scan from the continuous logcat. A hang is a failure like any
# other: diagnostics, a fresh driver, then the retry.
flow() { # name file [extra maestro args]
  local name=$1 file=$2; shift 2
  local started=$SECONDS log rc=0 first hung=0
  log="$OUT/logs/$(slug "$name")"
  run_flow "$log.log" "$file" "$@" || rc=$?
  if [ "$rc" = 0 ]; then
    record "$name" PASS "$((SECONDS - started)) s"
    return 0
  fi
  if timed_out "$rc"; then hung=1; hang_diagnostics "$log.hang"; reset_driver; fi
  first=$(failure_reason "$log.log" "$rc" "$log.hang" | cut -c1-120)
  rc=0
  run_flow "$log.retry.log" "$file" "$@" || rc=$?
  if [ "$rc" = 0 ]; then
    record "$name" PASS "$((SECONDS - started)) s — passed on retry; first failure: $first"
  else
    if timed_out "$rc"; then hung=1; hang_diagnostics "$log.retry.hang"; reset_driver; fi
    record "$name" FAIL "$(failure_reason "$log.retry.log" "$rc" "$log.retry.hang") (logs/$(slug "$name").retry.log)"
  fi
  # After a hang the next flow gets a fresh driver; otherwise it is reused
  # (restarting it on every flow costs minutes on API 34).
  [ "$hung" = 1 ] && adb_t shell am force-stop dev.mobile.maestro.test > /dev/null 2>&1
  [ "$rc" = 0 ]
}
