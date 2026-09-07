#!/usr/bin/env bash
# Android emulator smoke (RC2 program Part VII): install an APK on a running
# emulator (adb already connected), cold-launch it, complete onboarding into
# the French course, deep-link into the main screens, and fail on any
# crash/ANR or missing screen. Evidence (screenshots, UI dumps, logcat)
# lands in ./emulator-smoke/. Usage: scripts/emulator-smoke.sh path/to/app.apk
set -u
APK="${1:?apk path}"
PKG="${PKG:-com.vansyson1308.learningfrenchwithtracy}"
SCHEME="${SCHEME:-learningfrenchtracy}"
OUT="${OUT:-emulator-smoke}"
mkdir -p "$OUT"
fail=0; rows=""
note() { echo "$*"; }
row() { rows="${rows}| $1 | $2 | $3 |"$'\n'; [ "$2" = "PASS" ] || fail=1; }

dump_ui() { # -> $OUT/$1.xml ; prints all text/content-desc lines
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb pull /sdcard/ui.xml "$OUT/$1.xml" >/dev/null 2>&1 || true
}
shot() { adb exec-out screencap -p > "$OUT/$1.png" 2>/dev/null || true; }
texts() { # print the visible texts / content-descs of a dump (diagnostics in the job log)
  python3 - "$OUT/$1.xml" <<'PY'
import re, sys
try: x = open(sys.argv[1], encoding="utf-8", errors="replace").read()
except FileNotFoundError: print("   (no dump)"); sys.exit()
seen = []
for m in re.finditer(r'<node [^>]*>', x):
    n = m.group(0)
    for k in ("text", "content-desc"):
        v = re.search(k + r'="([^"]*)"', n)
        if v and v.group(1).strip() and v.group(1) not in seen: seen.append(v.group(1))
print("   visible:", " | ".join(t[:40] for t in seen[:30]))
PY
}
ui_has() { # text, dump-name
  grep -qiF -- "$1" "$OUT/$2.xml" 2>/dev/null
}
wait_text() { # text, seconds, dump-name -> 0/1
  local t="$1" secs="$2" name="$3" i=0
  while [ "$i" -lt "$secs" ]; do
    dump_ui "$name"
    ui_has "$t" "$name" && return 0
    sleep 2; i=$((i+2))
  done
  return 1
}
tap_text() { # text (matches text= or content-desc= case-insensitively), dump-name
  local t="$1" name="$2"
  dump_ui "$name"
  python3 - "$OUT/$name.xml" "$t" <<'PY'
import re, sys, subprocess
xml = open(sys.argv[1], encoding="utf-8", errors="replace").read(); want = sys.argv[2].lower()
best = None
for m in re.finditer(r'<node [^>]*>', xml):
    node = m.group(0)
    text = re.search(r'text="([^"]*)"', node); desc = re.search(r'content-desc="([^"]*)"', node)
    t = (text.group(1) if text else "").strip().lower(); d = (desc.group(1) if desc else "").strip().lower()
    exact = want in (t, d) or d.startswith(want + ",") or d.startswith(want + " ")
    contains = want in t or want in d
    if not contains: continue
    b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', node)
    if not b: continue
    x1,y1,x2,y2 = map(int, b.groups()); area=(x2-x1)*(y2-y1)
    if area <= 0: continue
    rank = (0 if exact else 1, area)
    if best is None or rank < best[0]: best = (rank, (x1+x2)//2, (y1+y2)//2, t or d)
if not best: print(f"NOTFOUND '{want}'"); sys.exit(1)
subprocess.run(["adb","shell","input","tap",str(best[1]),str(best[2])], check=False); print(f"tapped '{want}' -> node '{best[3][:50]}' at {best[1]},{best[2]}")
PY
}
alive() { adb shell pidof "$PKG" 2>/dev/null | grep -qE '[0-9]'; }
deeplink() { adb shell am start -W -a android.intent.action.VIEW -d "\"$SCHEME://$1\"" "$PKG" >/dev/null 2>&1; }

note "== device"; adb shell getprop ro.build.version.release; adb shell getprop ro.build.version.sdk; adb shell wm size
note "== install"; adb install -r "$APK" 2>&1 | tail -1
if adb shell pm list packages | grep -q "^package:$PKG$"; then row "install" PASS "$(adb shell dumpsys package "$PKG" | grep -E 'versionName|versionCode' | head -2 | tr -s ' \n' ' ')"; else row "install" FAIL "package not present"; fi
adb logcat -c 2>/dev/null || true
note "== cold launch"; adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
if wait_text "Daily XP goal" 60 launch; then row "cold launch → onboarding" PASS "'Daily XP goal' visible"; else row "cold launch → onboarding" FAIL "onboarding text not found in 60 s (alive=$(alive && echo yes || echo no))"; fi
shot 01-onboarding
# app label as the launcher sees it
LABEL=$(adb shell "cmd package resolve-activity --brief -c android.intent.category.LAUNCHER $PKG" 2>/dev/null | tail -1)
row "launcher activity" "$([ -n "$LABEL" ] && echo PASS || echo FAIL)" "$LABEL"
note "== onboarding: French → Learn French"
texts launch
onboard() {
  tap_text "French" onb1; sleep 1.5; texts onb1
  tap_text "Learn French" onb2 || tap_text "Start learning" onb2; sleep 3; texts onb2
}
onboard
landed() { wait_text "Studied French before?" 20 learn || wait_text "Section 1" 5 learn || wait_text "Today" 5 learn; }
if landed; then row "onboarding → Learn tab (French)" PASS "landed ($(grep -oiE 'Studied French before\?|Section 1|Today' "$OUT/learn.xml" | head -1))"; else
  note "-- onboarding retry"; onboard
  if landed; then row "onboarding → Learn tab (French)" PASS "landed after retry"; else row "onboarding → Learn tab (French)" FAIL "Learn tab not reached"; texts learn; fi
fi
shot 02-learn-tab
check_screen() { # route, expected text, name
  deeplink "$1"; sleep 2
  if wait_text "$2" 40 "$3"; then row "deep link $1" PASS "'$2' visible"; else row "deep link $1" FAIL "'$2' not found (alive=$(alive && echo yes || echo no))"; note "-- $1:"; texts "$3"; fi
  shot "$3"
}
check_screen "lesson/fr-en:u0-l0" "Check" 03-lesson
check_screen "vocabulary" "Vocabulary" 04-vocabulary
check_screen "placement/intro" "Find your starting point" 05-placement
check_screen "today" "Today" 06-today
check_screen "licenses" "Licenses" 07-licenses
check_screen "privacy" "Privacy" 08-privacy
check_screen "goals" "Your French goals" 09-goals
note "== background / foreground"
adb shell input keyevent KEYCODE_HOME; sleep 2; adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1; sleep 4
if alive; then row "background → foreground" PASS "process alive"; else row "background → foreground" FAIL "process gone"; fi
shot 10-after-resume
note "== logcat"
adb logcat -d -v time > "$OUT/logcat.txt" 2>/dev/null || true
if grep -qE "FATAL EXCEPTION|AndroidRuntime.*FATAL|ANR in $PKG|Force finishing activity.*$PKG" "$OUT/logcat.txt"; then row "crash / ANR scan" FAIL "see logcat.txt"; else row "crash / ANR scan" PASS "no FATAL / ANR for $PKG"; fi
grep -E "ReactNativeJS|E/(SQLite|ExpoModules|ExpoAudio|ExpoSpeech)" "$OUT/logcat.txt" | grep -iE "error|exception" | head -20 > "$OUT/js-errors.txt" || true
row "JS / module error lines" "$([ -s "$OUT/js-errors.txt" ] && echo FAIL || echo PASS)" "$(wc -l < "$OUT/js-errors.txt") line(s) in js-errors.txt"
adb shell dumpsys meminfo "$PKG" 2>/dev/null | grep -E "TOTAL PSS|TOTAL RSS" > "$OUT/meminfo.txt" || true
{ echo "## Emulator smoke ($PKG)"; echo; echo "| Step | Result | Note |"; echo "|---|---|---|"; printf '%s' "$rows"; echo; echo '```'; cat "$OUT/meminfo.txt"; echo '```'; } | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
[ "$fail" = 0 ] && echo "emulator smoke PASSED" || { echo "emulator smoke FAILED"; exit 1; }
