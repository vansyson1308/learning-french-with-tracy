# Android device acceptance — owner packets (RC2 program, Parts VIII–XV)

The automation environment has no phone and cannot reach one, so the
physical steps are handed to the owner **one packet at a time, at most five
actions each**, with an exact reply format. Everything else — installing
the results into the records, classifying defects (P0 crash/data loss/
privacy/false claim · P1 major journey broken · P2 real non-blocking · P3
cosmetic), reproducing, writing the regression test, fixing, rebuilding the
next RC — stays with the repository. A packet is never "does it work?"; it
always names the exact observation wanted.

Package: `com.vansyson1308.learningfrenchwithtracy` (below: `$PKG`).
Never paste a device serial number into a record; the packets do not ask
for one. Never send voice recordings; speech results are reported as
outcome categories only.

Reply format for every packet:

```
PACKET <n>
<item>: PASS | FAIL | N/A — <what you saw, one line>
attachments: <screenshots / logcat excerpt file names>
```

## Packet 0 — connect the phone (before RC2 exists this can be rehearsed)

1. On the phone: Settings → About phone → tap **Build number** seven times (Developer options on).
2. Settings → System → Developer options → **USB debugging** on.
3. Connect the phone by USB to the computer that has `adb`, unlock it, and accept the **Allow USB debugging** (RSA) prompt with "Always allow".
4. Run and send back the output (no serial is printed by these lines):
   ```
   adb shell getprop ro.product.manufacturer; adb shell getprop ro.product.model
   adb shell getprop ro.build.version.release; adb shell getprop ro.build.version.sdk
   adb shell wm size; adb shell wm density; adb shell grep MemTotal /proc/meminfo
   adb shell settings get secure voice_recognition_service
   adb shell pm list packages | grep -iE "speech|recognition|google.android.tts"
   ```
5. Leave the phone unlocked for the rest of the session.

## Packet 1 — install RC2 and capture the launch

1. Download `app.apk` from the RC2 record (`ANDROID_RC2.md` §4) and check its SHA-256 matches (`sha256sum app.apk` / `certutil -hashfile app.apk SHA256`).
2. `adb install app.apk` (a first sideload may show Android's *install unknown apps* prompt — allow it for this install only).
3. `adb shell dumpsys package $PKG | grep -E "versionName|versionCode|targetSdk"` → send the lines.
4. `adb logcat -c`, then launch the app from the launcher; after 30 seconds run
   `adb logcat -d -v time *:E | grep -iE "AndroidRuntime|FATAL|ReactNative|SQLite|Audio|Speech|Recogni" > 01-launch-errors.txt` and send the file (it should be empty or near-empty).
5. `adb exec-out screencap -p > 01-launch.png` and send it.

## Packet 2 — fresh-install persona (Part IX §27)

1. Home screen: app name and icon shown are "Learning French with Tracy" and the blue brand icon (screenshot `02-home.png`).
2. Cold start: splash colour/logo, no white flash, no debug overlay or red box; onboarding appears (`02-onboarding.png`).
3. Choose the French course; read the placement explanation; pick "start from the beginning" (`02-placement.png`).
4. Path screen: first lesson unlocked, later ones locked (`02-path.png`).
5. Profile screen: version shows 1.0.0 (build 1); Privacy and Licenses open (`02-profile.png`).

## Packet 3 — core learning, Today, Vocabulary (Part IX §28–§30)

1. Complete lesson 1 and lesson 2 of Section 1: every exercise type answers, a wrong answer is re-queued, completion screen shows XP; streak = 1 on Profile.
2. Today tab: start the session; note the counts it announces (reviews / new / practice) and whether it ends within the promised length; speaking steps offer **Skip this step**.
3. Vocabulary: open it and note the load time to first list (stopwatch, coarse is fine); search `café`, then `cafe`, then `oeuf` and `œuf` — same results?; open one entry: gender, pronunciation plays, example, memory state shown.
4. Any raw React warning, red box, or English placeholder text anywhere → screenshot.
5. Send `03-*.png` screenshots of one exercise, the Today summary and one vocabulary entry.

## Packet 4 — audio on the phone speaker (Part X §31–§32)

1. Section 1: play five word clips and two sentence clips; Section 3 listening lesson: play a clip, **Play again**, **Slow**.
2. Section 6: one conversation partner line; Section 2 numbers unit: three number clips; a Section-3 checkpoint clip.
3. The five ASR-flagged clips (`AUDIO_PROVENANCE_FINAL.md`) — rate each *intelligible / doubtful / wrong*: French *L'oiseau vole haut.* (Section 3 listening); Spanish course *El perro bebe agua.*, *La vaca come.*, *No quiero beber té.*; Portuguese course *A ovelha é mansa.*
4. Navigate away mid-clip (back, then Home): the audio stops; return: nothing keeps playing underneath.
5. Report: silence truncation / clipping / wrong voice / mispronunciation / volume / overlap — one line each, PASS or the clip name.

## Packet 5 — microphone and real French speech (Part X §33–§38)

1. First speaking step: **Allow** the microphone prompt; record; **Stop**; result appears. Then simulate a refusal without reinstalling: `adb shell pm revoke $PKG android.permission.RECORD_AUDIO`, open a speaking step: blocked panel with explanation, **Skip**, and **Open Settings** work, no crash; restore with `adb shell pm grant $PKG android.permission.RECORD_AUDIO`.
2. Real speech, one attempt each, report the category only (accepted / partly / rejected / technical): clear French; slightly accented French; a hesitation ("euh… je m'appelle…"); a number; a short phrase; the self-introduction item; an information-giving item.
3. **Rapid-stop race**, five times: say the last syllable and tap Stop at the same instant. Expected every time: a *technical* outcome ("we did not catch that", retry offered) — never a wrong answer, never a failed review, never a checkpoint failure. If anything else happens: `adb logcat -d -v time | grep -iE "speech|recogni|audio" > 05-rapidstop.txt`.
4. Airplane mode on: open a speaking step — does the recogniser work (on-device French model) or does the app show the *speech unavailable / needs internet* notice? Does the notice match what actually happened? Airplane mode off afterwards.
5. While recording, press Home; return after 5 seconds: recording aborted safely (technical state, no answer recorded), the next clip still plays. If headphones or a Bluetooth headset are at hand: play a clip, disconnect during playback, record once — no crash, no false failure.

## Packet 6 — writing, conversation, checkpoints, capstone (Part XI)

1. Writing exercise with the real keyboard: a valid answer; an answer missing one fact; accents omitted; the phone's smart apostrophe (’); keyword stuffing; a very long answer; hide/show the keyboard — feedback stays readable and names what is missing.
2. Conversation (Practice → Have a conversation), three scenarios: clean path; an alternative valid answer; "repeat"; "rephrase"; a wrong answer then repair; silence; a technical recognition problem. Does your meaning change the partner's reply?
3. Checkpoints: reception, speaking, writing, interaction — run each once; do answer options appear in a different order on a retake? Any correct answer visibly leaked?
4. A1 capstone: complete it; note the five domains, the form selected, the speech capability gate, the estimate result; the estimate must not say A1 unless every required objective was demonstrated.
5. Screenshots `06-*.png` of one writing feedback, one conversation turn, the checkpoint result, the capstone result.

## Packet 7 — backup and restore (Part XII)

1. Profile → **Export progress** → share sheet → save to Files/Drive; send the file *name and size* only (it contains no audio or transcripts — confirm by opening it as text if you like).
2. `adb shell pm clear $PKG` (wipes the app's data on purpose — the backup is the safety net).
3. Open the app → skip onboarding → Profile → **Import progress** → pick the file.
4. Check: completed lessons, streak, review cards, placement/starting point, checkpoint results and the A1 estimate are back.
5. Report any difference as FAIL with the item that was lost.

## Packet 8 — accessibility (Part XIII)

1. TalkBack on (Settings → Accessibility → TalkBack). Path screen: swipe through the lesson nodes — what does TalkBack announce for the current lesson and for a locked lesson (exact words)?
2. In a lesson: what is announced for an answer option, for the **Check** button before and after choosing, and for the feedback panel? Is focus moved to the feedback?
3. Speaking step: what is announced for the record button before, during and after recording (the state must be spoken)? Conversation: is the partner line read aloud and is the input field announced?
4. TalkBack off. Settings → Display → **Display size and text** → largest text and display size: lesson, options, writing, conversation, checkpoint, Goals — any control cut off or unreachable? (screenshot `08-large-*.png`).
5. If the Accessibility Scanner app is installed, run it on the lesson screen and the Goals screen and send its two summaries (findings are signals; each is reproduced manually before it is treated as a defect).

## Packet 9 — soak and resources (Part XIV)

1. Idle baseline after 2 minutes on the path screen:
   `adb shell dumpsys meminfo $PKG | grep -E "TOTAL PSS|TOTAL RSS|Native Heap|Dalvik Heap|Views:|Activities:" > 09-mem-00.txt`.
2. Background/foreground loop (automated):
   `for i in $(seq 1 20); do adb shell input keyevent KEYCODE_HOME; sleep 2; adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null; sleep 3; done`, then the meminfo line again → `09-mem-01.txt`.
3. Manual cycles with a meminfo sample after each block: 50 clip plays/replays (`09-mem-02.txt`), 50 speech attempts (`09-mem-03.txt`), 25 conversations (`09-mem-04.txt`), 25 vocabulary opens/searches (`09-mem-05.txt`), three lessons and two Today sessions (`09-mem-06.txt`).
4. Settings → Apps → Learning French with Tracy → Storage: note **Cache** before the speech block and after it (the speech cache is swept at the end of a session — it must not keep growing).
5. Send the seven files and the two cache sizes; also `adb logcat -d -v time *:E | grep -iE "AndroidRuntime|FATAL|ANR|lowmemorykiller|OutOfMemory" > 09-errors.txt`.

## Packet 10 — the user guide as the QA script + screenshots (Part XV)

1. Open `docs/USER_GUIDE.md` on the computer and follow sections 1–36 on the phone in order; for each: instruction exists? button text correct? navigation correct? result correct?
2. Reply with the section numbers that failed and the exact wording you saw (all others are PASS).
3. Capture the storyboard screenshots from `release/SCREENSHOT_MANIFEST.md` with `adb exec-out screencap -p > shot-<id>.png` (path, lesson, Today, vocabulary, listening, speaking, writing, conversation, Goals, Profile).
4. Before each shot: no notifications visible, no test email or private data on screen, no debug overlay.
5. Send the PNG files.

## What happens with the replies

Each reply is recorded the same day in `DEVICE_ACCEPTANCE.md` (rows A1–A24
and the persona table), `ACCESSIBILITY_FINAL.md` (rows A1–A15),
`SOAK_REPORT.md` (device blocks), `docs/USER_GUIDE_VALIDATION.md` (Android
RC2 column) and `ANDROID_RC2.md`. Every FAIL gets a severity, a
reproduction, a regression test where the engine is involved, a fix, a
full CI run, the next RC build, and a re-test of the exact failing scenario
on the phone. ANDROID DEVICE ACCEPTED is declared only with zero open
P0/P1 and the rows of Part XIX §64 all PASS or honestly limited.
