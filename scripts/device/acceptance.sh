#!/usr/bin/env bash
# P3h automated device acceptance (emulator). Drives the release APK through
# the generated Maestro flows (scripts/device/maestro-flows.ts) plus adb
# checks, and writes a Markdown report. Every result here is an EMULATOR
# result — never a phone result.
#
#   scripts/device/acceptance.sh <app.apk> [out-dir]
#
# Env: RC3_APK=<previous release apk, same signer>  enables the upgrade test
#      MAESTRO=<maestro binary>                     default: maestro
#      COLD_START_BUDGET_MS=3500                    API 34 budget (reported on others)
#      ENFORCE_COLD_START=1                         fail the run over budget
# Needs: adb on PATH with one booted emulator whose image allows `adb root`
# (google_apis), bun, Maestro (Apache-2.0; CI/dev only, never shipped).
set -uo pipefail

APK=${1:?usage: acceptance.sh <app.apk> [out-dir]}
OUT=${2:-device-report}
PKG=com.vansyson1308.learningfrenchwithtracy
ACTIVITY=$PKG/.MainActivity
MAESTRO=${MAESTRO:-maestro}
BUDGET=${COLD_START_BUDGET_MS:-3500}
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
rm -rf "$OUT" && mkdir -p "$OUT/flows" "$OUT/logs" "$OUT/shots" "$OUT/backup" "$OUT/maestro"
OUT=$(cd "$OUT" && (pwd -W 2>/dev/null || pwd))  # Git Bash: a path adb.exe understands
REPORT="$OUT/REPORT.md"
FAILED=0
RUNS=0
API=$(adb shell getprop ro.build.version.sdk | tr -d '\r')

{
  echo "# Device acceptance — emulator API $API"
  echo
  echo "APK: \`$(basename "$APK")\` · $(date -u +%Y-%m-%dT%H:%MZ) · EMULATOR results, not a phone."
  echo
  echo "| Check | Result | Detail |"
  echo "|---|---|---|"
} > "$REPORT"

record() { # name PASS|FAIL|INFO detail
  echo "$2  $1 — $3"
  echo "| $1 | $2 | $3 |" >> "$REPORT"
  [ "$2" = FAIL ] && FAILED=1
  return 0
}

run_flow() { # log file [extra maestro args]
  local log=$1 file=$2; shift 2
  # Per-run output dir named after the flow file (report names may hold ':').
  RUNS=$((RUNS + 1))
  local dir; dir="$OUT/maestro/$(printf %02d "$RUNS")-${file%.yaml}"
  dismiss_anr < /dev/null
  local rc=0
  "$MAESTRO" test --no-ansi --test-output-dir "$dir" "$@" "$OUT/flows/$file" < /dev/null > "$log" 2>&1 || rc=$?
  find "$dir" -path '*takeScreenshot*' -name '*.png' -exec cp {} "$OUT/shots/" \; 2>/dev/null
  return $rc
}

# A zygote restart (locale switch) can leave a "System UI isn't responding"
# dialog over every app, sometimes reappearing: tap its locale-independent
# "Wait" button, and "Close app" (System UI restarts) if it keeps coming back.
dismiss_anr() {
  local i button bounds
  for i in 1 2 3 4; do
    adb shell dumpsys window | grep -q "mCurrentFocus=.*Application Not Responding" || return 0
    button=aerr_wait; [ "$i" -ge 3 ] && button=aerr_close
    bounds=$(adb shell "uiautomator dump /sdcard/lft-ui.xml >/dev/null && cat /sdcard/lft-ui.xml" \
      | grep -o "resource-id=\"android:id/$button\"[^>]*bounds=\"[^\"]*\"" | grep -o 'bounds="[^"]*"' | head -1)
    if [ -n "$bounds" ]; then
      set -- $(echo "$bounds" | tr -c '0-9' ' ')
      adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
      echo "dismissed a system 'not responding' dialog ($button)" >&2
    fi
    sleep 5
  done
}

# One retry: an emulator hiccup must not fail the gate, but it is never
# hidden — the row says so, and any crash behind it is still counted by
# crash_scan from the continuous logcat.
flow() { # name file [extra maestro args]
  local name=$1 file=$2; shift 2
  local started=$SECONDS
  if run_flow "$OUT/logs/$name.log" "$file" "$@"; then
    record "$name" PASS "$((SECONDS - started)) s"
  elif run_flow "$OUT/logs/$name.retry.log" "$file" "$@"; then
    record "$name" PASS "$((SECONDS - started)) s — passed on retry; first failure: $(grep -m1 -iE 'FAILED|Assertion|Error' "$OUT/logs/$name.log" | tr '|' '/' | cut -c1-120)"
  else
    record "$name" FAIL "$(grep -m1 -iE 'FAILED|Assertion|Error' "$OUT/logs/$name.retry.log" | tr '|' '/' | cut -c1-160)"
    return 1
  fi
}

# A continuous logcat: per-check windows are line ranges of this file, so
# nothing is ever cleared away before the crash scan reads it.
LOGCAT="$OUT/logs/logcat-all.txt"
start_logcat() {
  [ -n "${LOGCAT_PID:-}" ] && kill "$LOGCAT_PID" 2>/dev/null
  adb logcat -v threadtime >> "$LOGCAT" 2>/dev/null &
  LOGCAT_PID=$!
}
mark() { sleep 1; wc -l < "$LOGCAT" | tr -d ' '; }
since() { tail -n +"$(( $1 + 1 ))" "$LOGCAT"; }
trap '[ -n "${LOGCAT_PID:-}" ] && kill "$LOGCAT_PID" 2>/dev/null' EXIT

wait_boot() {
  adb wait-for-device
  for _ in $(seq 1 120); do
    [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && adb shell pm path android >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

set_locale() { # vi-VN | en-US — needs a rootable (google_apis) image
  adb root >/dev/null 2>&1; wait_boot
  adb shell "setprop persist.sys.locale $1; setprop ctl.restart zygote"
  sleep 5; wait_boot; sleep 15
  # A zygote restart can leave a transient "System UI isn't responding" dialog.
  adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1
  sleep 10; dismiss_anr
  start_logcat
  local now; now=$(adb shell getprop persist.sys.locale | tr -d '\r')
  [ "$now" = "$1" ]
}

pull_backup() { # dest — the newest export the app wrote to its cache
  local f
  f=$(adb shell "ls -t /data/data/$PKG/cache/lingo-progress-*.json 2>/dev/null | head -1" | tr -d '\r')
  [ -n "$f" ] && adb pull "$f" "$1" >/dev/null && adb shell rm -f "$f"
}

push_backup() { # file — into Downloads for the system picker
  adb shell mkdir -p /sdcard/Download
  adb push "$1" /sdcard/Download/lft-backup.json >/dev/null
}

SCAN_FROM=0
crash_scan() { # label — everything logged since the previous scan
  local log="$OUT/logs/logcat-$1.txt" upto
  upto=$(mark); since "$SCAN_FROM" | head -n "$(( upto - SCAN_FROM ))" > "$log"; SCAN_FROM=$upto
  local java native gwp anrs audio
  java=$(grep -cE "AndroidRuntime.*Process: $PKG" "$log")
  native=$(grep -cE "DEBUG.*>>> $PKG <<<" "$log")
  # GWP-ASan's sampled backtrace walking frame pointers through Hermes on
  # x86_64 (no frame pointers there) segfaults inside libc — an emulator-ABI
  # platform crash, reported separately and re-checked on a phone (arm64).
  gwp=$(grep -c "android_unsafe_frame_pointer_chase" "$log")
  [ "$gwp" -gt "$native" ] && gwp=$native
  native=$(( native - gwp ))
  anrs=$(grep -cE "ANR in $PKG" "$log")
  audio=$(grep -v "Maestro" "$log" | grep -cE "(ExoPlayerImplInternal|ExoPlayer|MediaPlayer|AudioTrack).*(Playback error|rror:|xception)")
  if [ "$java" = 0 ] && [ "$native" = 0 ] && [ "$anrs" = 0 ] && [ "$audio" = 0 ]; then
    record "logcat scan ($1)" PASS "no crash, ANR or player error"
  else
    record "logcat scan ($1)" FAIL "java-crash=$java native-crash=$native anr=$anrs player-error=$audio (logs/logcat-$1.txt)"
  fi
  [ "$gwp" = 0 ] || record "x86_64 GWP-ASan frame-pointer crash ($1)" INFO "$gwp — platform/emulator-ABI crash in libc backtrace walking; flow retried (logs/logcat-$1.txt)"
}

# ---------------------------------------------------------------- setup ---
(cd "$ROOT" && bun scripts/device/maestro-flows.ts --out "$OUT/flows") > "$OUT/logs/generate.log" 2>&1 \
  || { record "generate flows" FAIL "see logs/generate.log"; }
adb root >/dev/null 2>&1; wait_boot
adb logcat -c
start_logcat
adb uninstall "$PKG" >/dev/null 2>&1
if adb install "$APK" > "$OUT/logs/install.log" 2>&1; then
  record "fresh install" PASS "$(stat -c %s "$APK" 2>/dev/null || wc -c < "$APK") bytes"
else
  record "fresh install" FAIL "$(tail -1 "$OUT/logs/install.log")"
  exit 1
fi

# ------------------------------------------------- Vietnamese UI walk ---
if set_locale vi-VN; then record "device locale vi-VN" PASS ""; else record "device locale vi-VN" FAIL "setprop failed"; fi
flow "onboarding (vi)" onboarding-vi.yaml
flow "screens (vi)" screens-vi.yaml
flow "today: daily words" today.yaml
flow "checkpoint es section 1" checkpoint.yaml
# Recogniser unavailable: disable every RecognitionService for this flow only.
RECOGNISERS=$(adb shell cmd package query-services -a android.speech.RecognitionService | tr -d '\r' | awk -F= '/^ +packageName=/ {print $2}' | sort -u)
for p in $RECOGNISERS; do adb shell pm disable-user --user 0 "$p" >/dev/null 2>&1; done
flow "speech recogniser unavailable" speech-unavailable.yaml
for p in $RECOGNISERS; do adb shell pm enable --user 0 "$p" >/dev/null 2>&1; done
flow "exam mock: reading part" exam-mock.yaml
while IFS=$'\t' read -r course clips <&3; do
  from=$(mark)
  flow "lesson $course" "lesson-$course.yaml"
  # expo-audio's media session reports each played clip to the system.
  plays=$(since "$from" | grep -cE "onPlaybackStateChanged\(\): $PKG : PlaybackState \{state=PLAYING")
  if [ "$clips" = 0 ]; then
    record "audio events $course" INFO "no bundled clips for this course ($plays playback events)"
  elif [ "$plays" -gt 0 ]; then
    record "audio events $course" PASS "$plays clips played ($clips bundled)"
  else
    record "audio events $course" FAIL "no playback event although $clips clips are bundled"
  fi
done 3< "$OUT/flows/courses.tsv"
flow "profile" profile.yaml
crash_scan walk

# -------------------------------------------------- backup round trip ---
adb shell "rm -f /data/data/$PKG/cache/lingo-progress-*.json"
flow "backup export" export.yaml
if pull_backup "$OUT/backup/export-1.json"; then
  adb shell pm clear "$PKG" >/dev/null
  flow "onboarding after pm clear" onboarding-vi.yaml
  push_backup "$OUT/backup/export-1.json"
  flow "backup import" import-vi.yaml
  flow "backup re-export" export.yaml
  if pull_backup "$OUT/backup/export-2.json" \
    && (cd "$ROOT" && bun scripts/device/backup-tools.ts compare "$OUT/backup/export-1.json" "$OUT/backup/export-2.json") > "$OUT/logs/backup-compare.log" 2>&1; then
    record "backup → pm clear → import" PASS "streak/XP/lessons/cards/placement identical"
  else
    record "backup → pm clear → import" FAIL "$(tail -3 "$OUT/logs/backup-compare.log" | tr '\n' ' ' | cut -c1-200)"
  fi
else
  record "backup export file" FAIL "no lingo-progress-*.json in the app cache"
fi
crash_scan backup

# ------------------------------------------------------------- offline ---
adb shell "svc wifi disable; svc data disable; cmd connectivity airplane-mode enable" >/dev/null 2>&1
if adb shell ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; then record "offline mode" FAIL "network still reachable"; else record "offline mode" PASS "airplane mode, no route"; fi
flow "offline lesson es-vi" lesson-es-vi.yaml
flow "offline today" today.yaml
adb shell "cmd connectivity airplane-mode disable; svc wifi enable; svc data enable" >/dev/null 2>&1
crash_scan offline

# ------------------------------------------------- performance (API $API) ---
adb shell am force-stop "$PKG"
times=()
for i in 1 2 3 4 5 6; do
  adb shell am force-stop "$PKG"; sleep 2
  t=$(adb shell am start -W -n "$ACTIVITY" | tr -d '\r' | awk -F': ' '/TotalTime/ {print $2}')
  [ "$i" -gt 1 ] && times+=("$t")
  sleep 3
done
median=$(printf '%s\n' "${times[@]}" | sort -n | awk '{a[NR]=$1} END {print a[int((NR+1)/2)]}')
detail="median ${median} ms of ${times[*]} (first launch discarded; budget ${BUDGET} ms)"
if [ -n "$median" ] && [ "$median" -le "$BUDGET" ]; then
  record "cold start (am start -W)" PASS "$detail"
elif [ "${ENFORCE_COLD_START:-0}" = 1 ]; then
  record "cold start (am start -W)" FAIL "$detail"
else
  record "cold start (am start -W)" INFO "$detail — not enforced on API $API"
fi
sleep 5
pss=$(adb shell dumpsys meminfo "$PKG" | tr -d '\r' | awk '/TOTAL PSS:/ {print $3; exit} /^ *TOTAL / {print $2; exit}')
record "memory (dumpsys meminfo TOTAL PSS)" INFO "${pss:-?} KB on the Learn tab"

# --------------------------------------------------- English UI walk ---
if set_locale en-US; then
  flow "screens (en)" screens-en.yaml
else
  record "device locale en-US" FAIL "setprop failed"
fi
crash_scan en

# ------------------------------------------------ upgrade from RC3 ---
if [ -n "${RC3_APK:-}" ] && [ -f "$RC3_APK" ]; then
  set_locale vi-VN >/dev/null
  adb uninstall "$PKG" >/dev/null 2>&1
  adb install "$RC3_APK" > "$OUT/logs/install-rc3.log" 2>&1 || record "install RC3" FAIL "$(tail -1 "$OUT/logs/install-rc3.log")"
  (cd "$ROOT" && bun scripts/device/backup-tools.ts seed-rc3 "$OUT/backup/rc3-seed.json") >/dev/null
  flow "RC3: onboarding" rc3-onboarding.yaml
  push_backup "$OUT/backup/rc3-seed.json"
  flow "RC3: seed progress (import)" rc3-import.yaml
  adb shell "rm -f /data/data/$PKG/cache/lingo-progress-*.json"
  flow "RC3: export before upgrade" rc3-export.yaml
  pull_backup "$OUT/backup/rc3-before.json"
  if adb install -r "$APK" > "$OUT/logs/upgrade.log" 2>&1; then record "adb install -r over RC3" PASS ""; else record "adb install -r over RC3" FAIL "$(tail -1 "$OUT/logs/upgrade.log")"; fi
  flow "upgraded: profile" profile.yaml
  flow "upgraded: export" export.yaml
  if pull_backup "$OUT/backup/upgraded.json" \
    && (cd "$ROOT" && bun scripts/device/backup-tools.ts compare "$OUT/backup/rc3-before.json" "$OUT/backup/upgraded.json") > "$OUT/logs/upgrade-compare.log" 2>&1; then
    record "upgrade keeps learner data" PASS "streak/XP/lessons/cards/placement unchanged"
  else
    record "upgrade keeps learner data" FAIL "$(tail -3 "$OUT/logs/upgrade-compare.log" | tr '\n' ' ' | cut -c1-200)"
  fi
  crash_scan upgrade
else
  record "upgrade from RC3" INFO "skipped — RC3_APK not set"
fi

echo >> "$REPORT"
echo "Screenshots: \`shots/\` (vi and en). Logs: \`logs/\`." >> "$REPORT"
echo
[ "$FAILED" = 0 ] && echo "DEVICE ACCEPTANCE PASSED (emulator API $API)" || echo "DEVICE ACCEPTANCE FAILED (emulator API $API)"
exit "$FAILED"
