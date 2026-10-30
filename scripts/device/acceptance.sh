#!/usr/bin/env bash
# P3h automated device acceptance (emulator). Drives the release APK through
# the generated Maestro flows (scripts/device/maestro-flows.ts) plus adb
# checks, and writes a Markdown report. Every result here is an EMULATOR
# result — never a phone result.
#
#   scripts/device/acceptance.sh <app.apk> [out-dir]
#
# Env: SHARD=all|core|lessons|backup-upgrade        default: all (CI runs one shard per job)
#      RC3_APK=<previous release apk, same signer>  enables the upgrade test
#      MAESTRO=<maestro binary>                     default: maestro
#      DEVICE / FLOW_TIMEOUT / FLOW_KILL_AFTER      see flow-runner.sh
#      COLD_START_BUDGET_MS=3500                    API 34 budget (reported on others)
#      ENFORCE_COLD_START=1                         fail the run over budget
#      OPUS_DIAGNOSTICS=1                           the APK was built with LFT_ACCEPTANCE_DIAGNOSTICS=1:
#                                                   run the Opus playback check (lessons shard)
#
# Shards (each on its own fresh emulator, all after install + vi onboarding):
#   core            Vietnamese screens, Today, checkpoint, recogniser
#                   unavailable, exam mock part, Profile, offline, cold
#                   start, memory, English screens
#   lessons         the first lesson of every shipped course + audio evidence,
#                   then the Opus playback check (OPUS_DIAGNOSTICS=1 only)
#   backup-upgrade  backup export → pm clear → import, upgrade from RC3
# Needs: adb on PATH with one booted emulator whose image allows `adb root`
# (google_apis), bun, Maestro (Apache-2.0; CI/dev only, never shipped).
set -uo pipefail

APK=${1:?usage: acceptance.sh <app.apk> [out-dir]}
OUT=${2:-device-report}
PKG=com.vansyson1308.learningfrenchwithtracy
ACTIVITY=$PKG/.MainActivity
MAESTRO=${MAESTRO:-maestro}
BUDGET=${COLD_START_BUDGET_MS:-3500}
SHARD=${SHARD:-all}
case "$SHARD" in all|core|lessons|backup-upgrade) ;; *) echo "unknown SHARD=$SHARD" >&2; exit 2 ;; esac
export MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'
# No network side-calls from the CLI (analytics, update and analysis notices).
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export MAESTRO_DRIVER_STARTUP_TIMEOUT=${MAESTRO_DRIVER_STARTUP_TIMEOUT:-120000}

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
rm -rf "$OUT" && mkdir -p "$OUT/flows" "$OUT/logs" "$OUT/shots" "$OUT/backup" "$OUT/maestro"
OUT=$(cd "$OUT" && (pwd -W 2>/dev/null || pwd))  # Git Bash: a path adb.exe understands
REPORT="$OUT/REPORT.md"
FAILED=0
RUNS=0
# shellcheck source=flow-runner.sh
. "$ROOT/scripts/device/flow-runner.sh"
# shellcheck source=emulator-health.sh
. "$ROOT/scripts/device/emulator-health.sh"
API=$(adb_t shell getprop ro.build.version.sdk | tr -d '\r')

{
  echo "# Device acceptance — emulator API $API · shard $SHARD"
  echo
  echo "APK: \`$(basename "$APK")\` · $(date -u +%Y-%m-%dT%H:%MZ) · EMULATOR results, not a phone."
  echo
  echo "| Check | Result | Detail |"
  echo "|---|---|---|"
} > "$REPORT"

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
finish() {
  [ -n "${LOGCAT_PID:-}" ] && kill "$LOGCAT_PID" 2>/dev/null
  if [ "${WATCHDOG:-0}" = 1 ]; then
    record "suite watchdog" FAIL "the run was stopped by its time limit; see the last rows and logs/"
  fi
  # upload-artifact rejects " : < > | * ? in paths: rename deepest first.
  find "$OUT" -depth -name '*[":<>|*?]*' 2>/dev/null | while IFS= read -r f; do
    mv "$f" "$(dirname "$f")/$(basename "$f" | tr '":<>|*?' '_______')"
  done
}
trap finish EXIT
# The CI runner wraps this script in `timeout`: a residual hang ends as a
# failure with the report written, not as a cancelled job.
trap 'WATCHDOG=1; exit 1' TERM INT

wait_boot() {
  adb wait-for-device
  for _ in $(seq 1 120); do
    [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ] && adb shell pm path android >/dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

system_pid() { adb_t shell pidof system_server | tr -d '\r'; }

# After `ctl.restart zygote`, sys.boot_completed still holds the previous
# boot's 1 and `pm` answers long before ActivityManager and WindowManager are
# up: anything sent then (a force-stop, an install) can crash the half-started
# system_server (API 30: NPE in onForceStopPackage, then a restart loop). So
# the property is cleared before the restart — ActivityManager sets it again
# when the new system_server has finished booting — and that system_server
# must be a new process that stays up.
wait_framework() { # system_server pid before the restart
  local old=$1 pid
  for _ in $(seq 1 120); do
    pid=$(system_pid)
    if [ -n "$pid" ] && [ "$pid" != "$old" ] \
      && [ "$(adb_t shell getprop sys.boot_completed | tr -d '\r')" = 1 ] \
      && adb_t shell pm path android >/dev/null 2>&1; then
      sleep 15
      [ "$(system_pid)" = "$pid" ] && return 0
    fi
    sleep 2
  done
  return 1
}

set_locale() { # vi-VN | en-US — needs a rootable (google_apis) image
  adb root >/dev/null 2>&1; wait_boot
  local now old
  now=$(adb_t shell getprop persist.sys.locale | tr -d '\r')
  if [ "$now" != "$1" ]; then  # a restart only when the locale changes
    old=$(system_pid)
    adb shell "setprop persist.sys.locale $1; setprop sys.boot_completed 0; setprop ctl.restart zygote"
    wait_framework "$old" || return 1
    # A zygote restart can leave a transient "System UI isn't responding" dialog.
    adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1
    sleep 10; dismiss_anr
  fi
  start_logcat
  now=$(adb_t shell getprop persist.sys.locale | tr -d '\r')
  [ "$now" = "$1" ]
}

pull_backup() { # dest — the newest export the app wrote to its cache
  local f
  f=$(adb shell "ls -t /data/data/$PKG/cache/lingo-progress-*.json 2>/dev/null | head -1" | tr -d '\r')
  [ -n "$f" ] && adb pull "$f" "$1" >/dev/null && adb shell rm -f "$f"
}

# Into Downloads for the system picker. Since API 29 DocumentsUI lists
# Downloads and Recents from MediaStore, and `adb push` indexes nothing: a
# fresh device shows an empty picker until the file is scanned.
BACKUP_NAME=lft-backup.json
BACKUP_PATH=/storage/emulated/0/Download/$BACKUP_NAME
push_backup() { # file
  local i
  adb shell mkdir -p /storage/emulated/0/Download
  adb push "$1" "$BACKUP_PATH" >/dev/null || return 1
  for i in 1 2 3 4 5 6; do
    adb shell "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://$BACKUP_PATH" >/dev/null 2>&1
    [ "$i" -ge 2 ] && adb shell "content call --uri content://media --method scan_volume --arg external_primary" >/dev/null 2>&1
    adb shell "content query --uri content://media/external/file --projection _display_name --where \"_display_name='$BACKUP_NAME'\"" 2>/dev/null \
      | grep -q "$BACKUP_NAME" && return 0
    sleep 5
  done
  return 1
}
index_backup() { # file label
  if push_backup "$1"; then
    record "$2: backup indexed (MediaStore)" PASS ""
  else
    record "$2: backup indexed (MediaStore)" INFO "MediaStore row not confirmed; the picker step decides"
  fi
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
# The Vietnamese locale needs a framework restart, the step that kills emulators.
# It runs before install, inside the health check: a death here is one wipe and
# reboot, not a failed shard. (-change-locale races the emulator-runner's own adb
# commands, "Broken pipe"; -prop persist.sys.locale does not take.)
locale_vi() { set_locale vi-VN; }
BOOT_PREPARE=locale_vi
if ! ensure_healthy; then
  record "emulator health" FAIL "$INFRA_RETRIES infra retries, still unhealthy: $INFRA_REASON"
  exit 1
fi
record_infra
record "device locale vi-VN" PASS ""
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
flow "onboarding (vi)" onboarding-vi.yaml

walk_vi() {
  flow "screens (vi)" screens-vi.yaml
  flow "today: daily words" today.yaml
  flow "read & listen: story, questions, word check" stories.yaml
  flow "checkpoint es section 1" checkpoint.yaml
  # Recogniser unavailable: disable every RecognitionService for this flow only.
  RECOGNISERS=$(adb_t shell cmd package query-services -a android.speech.RecognitionService | tr -d '\r' | awk -F= '/^ +packageName=/ {print $2}' | sort -u)
  for p in $RECOGNISERS; do adb shell pm disable-user --user 0 "$p" >/dev/null 2>&1; done
  flow "speech recogniser unavailable" speech-unavailable.yaml
  for p in $RECOGNISERS; do adb shell pm enable --user 0 "$p" >/dev/null 2>&1; done
  flow "exam mock: reading part" exam-mock.yaml
}

lessons() {
  local course clips floor from plays starts detail
  APP_UID=$(adb_t shell pm list packages -U "$PKG" | tr -d '\r' | sed -n 's/.*uid:\([0-9]*\).*/\1/p' | head -1)
  while IFS=$'\t' read -r course clips <&3; do
    # Playback evidence, two system signals: the media session expo-audio
    # reports to (logcat; its format differs by API level) and the audio
    # service's player event log (`dumpsys audio`).
    adb_t shell dumpsys audio > "$OUT/logs/audio-before-$course.txt" 2>/dev/null
    floor=$(evidence max-piid "$OUT/logs/audio-before-$course.txt")
    from=$(mark)
    flow "lesson $course" "lesson-$course.yaml"
    since "$from" > "$OUT/logs/logcat-lesson-$course.txt"
    adb_t shell dumpsys audio > "$OUT/logs/audio-after-$course.txt" 2>/dev/null
    read -r plays starts <<< "$(evidence count "$PKG" "${APP_UID:-0}" "${floor:-0}" "$OUT/logs/logcat-lesson-$course.txt" "$OUT/logs/audio-after-$course.txt")"
    plays=${plays:-0} starts=${starts:-0}
    detail="$plays media-session plays, $starts audio-service starts"
    if [ "$clips" = 0 ]; then
      record "audio events $course" INFO "no bundled clips for this course ($detail)"
    elif [ "$plays" -gt 0 ] || [ "$starts" -gt 0 ]; then
      record "audio events $course" PASS "$detail ($clips bundled)"
    else
      record "audio events $course" FAIL "no playback event although $clips clips are bundled (uid ${APP_UID:-?}; logs/audio-after-$course.txt)"
    fi
  done 3< "$OUT/flows/courses.tsv"
}
evidence() { (cd "$ROOT" && bun scripts/device/audio-evidence.ts "$@"); }

# Opus playback check (release/ASSET_DELIVERY.md): one Opus mono 16 kbps story
# sentence through expo-audio at rate 1 and in slow mode. The screen exists
# only in an APK built with LFT_ACCEPTANCE_DIAGNOSTICS=1; OPUS_DIAGNOSTICS=1
# says this APK is one (device-acceptance.yml sets both).
opus_playback() {
  local from line
  if [ "${OPUS_DIAGNOSTICS:-0}" != 1 ]; then
    record "opus playback (diagnostics)" INFO "skipped — OPUS_DIAGNOSTICS is not 1 (APK built without LFT_ACCEPTANCE_DIAGNOSTICS=1)"
    return 0
  fi
  from=$(mark)
  flow "opus playback: loaded, playing, finished at 1.0 and slow, no decoder error" diagnostics-opus.yaml
  since "$from" > "$OUT/logs/logcat-opus.txt"
  line=$(grep -o 'LFT_DIAG_OPUS .*' "$OUT/logs/logcat-opus.txt" | tail -1 | tr '|' '/' | cut -c1-300)
  record "opus playback events (app log)" INFO "${line:-no LFT_DIAG_OPUS line in logcat}"
}

backup_round_trip() {
  adb shell "rm -f /data/data/$PKG/cache/lingo-progress-*.json"
  flow "backup export" export.yaml
  if pull_backup "$OUT/backup/export-1.json"; then
    adb shell pm clear "$PKG" >/dev/null
    flow "onboarding after pm clear" onboarding-vi.yaml
    index_backup "$OUT/backup/export-1.json" "backup"
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
}

offline() {
  adb shell "svc wifi disable; svc data disable; cmd connectivity airplane-mode enable" >/dev/null 2>&1
  if adb shell ping -c1 -W2 8.8.8.8 >/dev/null 2>&1; then record "offline mode" FAIL "network still reachable"; else record "offline mode" PASS "airplane mode, no route"; fi
  flow "offline lesson es-vi" lesson-es-vi.yaml
  flow "offline today" today.yaml
  adb shell "cmd connectivity airplane-mode disable; svc wifi enable; svc data enable" >/dev/null 2>&1
  crash_scan offline
}

performance() {
  local i t median detail pss times=()
  adb shell am force-stop "$PKG"
  for i in 1 2 3 4 5 6; do
    adb shell am force-stop "$PKG"; sleep 2
    t=$(adb_t shell am start -W -n "$ACTIVITY" | tr -d '\r' | awk -F': ' '/TotalTime/ {print $2}')
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
  pss=$(adb_t shell dumpsys meminfo "$PKG" | tr -d '\r' | awk '/TOTAL PSS:/ {print $3; exit} /^ *TOTAL / {print $2; exit}')
  record "memory (dumpsys meminfo TOTAL PSS)" INFO "${pss:-?} KB on the Learn tab"
}

walk_en() {
  if set_locale en-US; then
    flow "screens (en)" screens-en.yaml
  else
    record "device locale en-US" FAIL "setprop failed"
  fi
  crash_scan en
}

upgrade_from_rc3() {
  if [ -z "${RC3_APK:-}" ] || [ ! -f "$RC3_APK" ]; then
    record "upgrade from RC3" INFO "skipped — RC3_APK not set"
    return 0
  fi
  set_locale vi-VN >/dev/null
  adb uninstall "$PKG" >/dev/null 2>&1
  adb install "$RC3_APK" > "$OUT/logs/install-rc3.log" 2>&1 || record "install RC3" FAIL "$(tail -1 "$OUT/logs/install-rc3.log")"
  (cd "$ROOT" && bun scripts/device/backup-tools.ts seed-rc3 "$OUT/backup/rc3-seed.json") >/dev/null
  flow "RC3: onboarding" rc3-onboarding.yaml
  index_backup "$OUT/backup/rc3-seed.json" "RC3"
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
}

# ------------------------------------------------------------ the run ---
# `all` keeps the original single-device order; a shard runs its part on
# a device that has only been through install + onboarding.
case "$SHARD" in
  all)
    walk_vi; lessons; opus_playback; flow "profile" profile.yaml; crash_scan walk
    backup_round_trip; offline; performance; walk_en; upgrade_from_rc3 ;;
  core)
    walk_vi; flow "profile" profile.yaml; crash_scan walk
    offline; performance; walk_en ;;
  lessons)
    # crash_scan also counts ExoPlayer/MediaPlayer/AudioTrack errors: an Opus decoder error fails here too.
    lessons; opus_playback; crash_scan lessons ;;
  backup-upgrade)
    # Learner data worth carrying across: a finished lesson, reviewed cards
    # and the checkpoint's score.
    flow "progress: lesson es-vi" lesson-es-vi.yaml
    flow "progress: today" today.yaml
    flow "progress: checkpoint" checkpoint.yaml
    crash_scan progress
    backup_round_trip; upgrade_from_rc3 ;;
esac

echo >> "$REPORT"
echo "Screenshots: \`shots/\`. Logs: \`logs/\` (a hung flow leaves \`logs/<flow>.hang/\`)." >> "$REPORT"
echo
[ "$FAILED" = 0 ] && echo "DEVICE ACCEPTANCE PASSED (emulator API $API, shard $SHARD)" || echo "DEVICE ACCEPTANCE FAILED (emulator API $API, shard $SHARD)"
exit "$FAILED"
