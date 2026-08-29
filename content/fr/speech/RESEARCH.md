# Phase 8 Speech Research — Spoken Production Foundation

Evidence base for the Phase-8 microphone/speech-recognition work. Everything
in this note that drives a technical decision was read from a pinned source
in this session; where sandbox egress blocks a primary source, that is said
explicitly and the claim is limited accordingly.

## 1. Sources consulted (by identity)

| Source | How consulted | Status |
|---|---|---|
| `jamsch/expo-speech-recognition` @ `64705c8` (v56.0.4) | full clone; README, CHANGELOG, `package.json`, JS types, `app.plugin.js`, Android Kotlin sources, iOS Swift sources read directly | PRIMARY — all provider claims below cite this code |
| `expo-audio` ~56.0.12 | installed `node_modules` type declarations (the authority for our pinned SDK) | PRIMARY |
| Expo SDK 56 config / CNG | project `app.json`, absence of committed `ios/`/`android/` (managed workflow), `expo prebuild` run locally in Gate 1 | PRIMARY |
| Project sources | `content/fr/assessment/*`, `content/fr/reception/*`, session controller, evidence contract, claim gate, placement v2, TODAY composer, compiler, lexicon + audio pipelines | PRIMARY |
| Apple Speech framework (`SFSpeechRecognizer`) | developer.apple.com is egress-blocked in this environment; semantics are taken from (a) the provider's Swift code, which exercises the API directly, and (b) training knowledge | SECONDARY — platform behavior asserted only where the provider code or its changelog demonstrates it |
| Android `android.speech.SpeechRecognizer` | developer.android.com egress-blocked; same posture: provider Kotlin code + training knowledge | SECONDARY |
| CEFR Companion Volume 2020 (oral production scales) | coe.int egress-blocked (consistent with Phases 6-7); scales are cited by identity, all can-do wording is original paraphrase | SECONDARY — same clean-room rule as `content/fr/assessment/RESEARCH.md` |
| iOS 26 SpeechAnalyzer / SpeechTranscriber | NOT consulted as a dependency; noted only as a possible future capability path. This app supports iOS 16.4+, so `SFSpeechRecognizer` is the baseline | OUT OF SCOPE |

## 2. Provider evaluation — expo-speech-recognition 56.0.4

Version 56.0.4, MIT license, versioned in lockstep with Expo SDK 56 (its
56.0.0 release raised the minimum iOS to 16.4 — exactly this app's floor).
Repository pinned at commit `64705c8`.

### Event contract (from `src/ExpoSpeechRecognitionModule.types.ts`)
`result {isFinal, results[{transcript, confidence}]}` (n-best via
`maxAlternatives`, default 5), `error {error, message}` with codes
distinguishing `no-speech`, `aborted`, `interrupted` (iOS session
interruption), `not-allowed`, `service-not-allowed`, `language-not-supported`,
`network`, `busy`, `audio-capture`, `speech-timeout`/`client` (Android),
plus lifecycle events `start`/`end`/`audiostart`/`audioend`/`nomatch`.

### Android semantics (from `ExpoSpeechService.kt`)
- `stop()` posts `stopListening()` on the main handler and then WAITS for the
  platform's `onResults()`/`onError()` — the final transcript, when the
  engine produces one, arrives as `result{isFinal:true}` followed by `end`.
  **The stop race is real**: an engine that had nothing finalized answers
  with an error (`no-speech`/`client`) or an empty `onResults` → `nomatch`.
  Consequence for us: "end without a final result after stop" must be a
  TECHNICAL outcome with its own state, never a learner failure, and never
  patched over by promoting the last partial.
- `abort()`/`destroy()` cancel + destroy the platform recognizer and emit
  `end` with no final; `destroy()` additionally neuters the event emitter, so
  late native callbacks after disposal cannot reach JS.
- Every completed recognition tears down and DESTROYS the `SpeechRecognizer`
  (fresh instance per attempt) — the leak class the mandate names is handled
  at the provider layer, and our port still guards by attempt id.
- On-device: `createOnDeviceSpeechRecognizer` used when
  `requiresOnDeviceRecognition` is set; `EXTRA_PREFER_OFFLINE` /
  `EXTRA_BIASING_STRINGS` (API 33+) available through intent options;
  `androidTriggerOfflineModelDownload` exists for model installs;
  `getSupportedLocales` reports installed on-device locales.
- Empty final results emit `nomatch` (mapped by us to a technical
  no-result outcome, distinguishable from a WRONG recognized answer).
- 56.0.4 specifically fixed minified-release metadata — an Android
  release-build breakage we would have hit.

### iOS semantics (from `ExpoSpeechRecognizer.swift`)
- `stop()` → `request.endAudio()` + engine stop + `task.finish()` → the
  framework delivers the final `isFinal` result; double-stop is guarded by a
  `stoppedListening` flag; `abort()` cancels with `end` and no final.
- Contains an explicit iOS 18 workaround (Apple regression where `isFinal`
  may never arrive): a final-like result is detected via
  `speechRecognitionMetadata.speechDuration` — a REAL platform defect the
  provider absorbs; our state machine still owns a finalize timeout above it.
- Audio session: configured at start to `playAndRecord` + `measurement`
  (+ `defaultToSpeaker`, `allowBluetooth`), `setActive(true,
  .notifyOthersOnDeactivation)`; interruption and route-change notifications
  are observed and surface as `interrupted` errors. **The provider does NOT
  restore the previous session configuration after recognition ends** — the
  session simply stays as configured. This is the one concrete coexistence
  risk with Phase-7 playback (measurement mode affects playback), and it is
  OURS to own: the app re-asserts its playback audio mode after every
  attempt terminates (see §5).
- Permission requesters exist for microphone and speech recognition
  separately; 56.0.2 fixed a permission-callback race (granted resolving
  false immediately after granting).
- Results carry `confidence` (may be -1/unavailable) — grading never uses it.

### Config plugin (`app.plugin.js`)
Sets `NSSpeechRecognitionUsageDescription` + `NSMicrophoneUsageDescription`
(overridable via `microphonePermission` / `speechRecognitionPermission`
props), adds `RECORD_AUDIO` and a `RecognitionService` manifest `<queries>`
entry on Android (required for `SpeechRecognizer` visibility on Android 11+).
No background-recording services are added. This app's manifest already
declares `RECORD_AUDIO` (upstream expo-audio plugin default).

### Recording persistence
`recordingOptions.persist` writes the attempt's audio to a cache-directory
file (path delivered on `audioend`). This is the SINGLE capture strategy for
Phase 8: replaying the learner's own attempt uses the recognizer's persisted
file. The expo-audio *recorder* is deliberately NOT used — two concurrent
capturers contending for the microphone is the exact contention class the
mandate forbids, so recording-without-recognition is not a Phase-8 feature.
Replay is a CAPABILITY (`recordingPersistenceAvailable`), never a
prerequisite for grading.

## 3. Construct model (non-negotiable distinctions)

- **STT transcription accuracy ≠ pronunciation quality.** A transcript
  mismatch may be a language error, a pronunciation issue, or a recognizer
  error; the product never claims to separate them and never emits a
  pronunciation score.
- **Pronunciation/repetition practice ≠ spoken production.** Repeating a
  visible/heard model is valuable practice and is graded for feedback only;
  it can never create production-claim evidence or `speak` FSRS evidence.
- **Spoken production ≠ spoken interaction.** Phase 8 assesses elicited
  monologic production (cue → French); conversation/interaction remains
  explicitly unassessed and unclaimed.
- Read-aloud is practice at most; it is not independent oral production.

## 4. CEFR anchors (scales by identity, original wording)

Phase-8 objectives align to the Companion Volume's A1 oral-production
scales, referenced by scale identity with our own can-do phrasing
(the Phase-6 clean-room rule):

- **Overall oral production (A1)** — producing simple, mainly isolated
  phrases about people and places.
- **Sustained monologue: describing experience (A1)** — describing oneself,
  what one does, where one lives, in short formulaic stretches.
- **Sustained monologue: giving information (A1)** — short, simple factual
  statements.
- **Phonological control** is consulted ONLY to understand the construct
  (why pronunciation is not scored); no phonology claim is made anywhere.

The claim gate treats these exactly like the Phase-7 reception scales:
product-local evidence-sufficiency thresholds, never Council of Europe cut
scores; wording stays "CEFR-aligned estimate", never certification.

## 5. Audio-session coordination policy (P8 §10)

One policy, owned by the app (not scattered through renderers):

1. BEFORE an attempt starts: instructional playback is stopped (the speaking
   step never mounts a listening player mid-playback; model audio players
   are paused/released), then the recognizer configures the session.
2. DURING an attempt: no app audio is played; scored speech never overlaps
   prompt audio.
3. AFTER the attempt terminates (any terminal state): the app re-asserts its
   normal playback audio mode (the provider leaves the session in
   record/measurement configuration by design — §2), so Phase-7 playback
   keeps working.
4. Backgrounding during an attempt aborts it as a TECHNICAL interruption:
   no grading, no SRS mutation, no assessment submission, no penalty.
5. Background recording is never enabled; no foreground service is added.

## 6. Privacy contract (P8 §8)

On-device recognition is preferred and represented honestly:
`requiresOnDeviceRecognition` is set whenever the capability probe shows
French on-device support; when only network-backed system recognition is
available, that mode is DISCLOSED in the speaking UI before the learner
records, and scored eligibility is unaffected (the system service is the
platform's own recognizer, not a third-party SaaS). No cloud STT vendor is
added. Raw audio lives only in the recognizer's cache file, is deleted when
the step/session no longer needs it, is swept at session boundaries, and
never enters Zustand/AsyncStorage/backups/logs/analytics. Transcripts are
ephemeral in-session UX state. Permissions are requested only at the point
of use, never at startup.

## 7. Environment ceiling for native validation (stated up front)

This execution environment has no Android SDK, no Xcode, and no physical
device — identical to Phases 3-7, where the recorded native ceiling was
Hermes bytecode export + config-level validation. Phase 8 adds `expo
prebuild` runs to verify the config plugin's generated manifest/plist
output. Anything beyond that (a real microphone path on hardware) is
honestly reported as an outstanding release gate; the feature is
capability-gated so that on any environment where speech cannot be probed
and started, speaking surfaces degrade to "unavailable / not now" with the
learner unpenalized. Nothing in this phase is reported as device-tested.

## 8. Gate-1 spike verdict (the fifteen questions)

Answered from the pinned provider sources, this repo's prebuild run, and
design decisions in this phase. "By source" = proven by reading the code
path; "outstanding on device" = cannot be exercised in this environment and
is carried as an explicit release gate (§7).

1. **fr-FR initialization** — by source: `lang` is passed through to both
   platform recognizers; French is a standard system locale. Outstanding on
   device.
2. **Microphone permission** — by source: separate mic + speech requesters
   on iOS (with the 56.0.2 callback-race fix), RECORD_AUDIO flow on Android;
   verified in the generated manifest/plist by prebuild.
3. **On-device capability detection** — by source:
   `supportsOnDeviceRecognition()` plus `getSupportedLocales()`
   (installed locales) on both platforms.
4. **FINAL transcript** — by source: stop() drives the platform's final
   result on both platforms (`onResults` / `task.finish()`), including the
   provider's iOS-18 missing-`isFinal` workaround. Outstanding on device.
5. **Rapid stop losing the result** — REAL, by source, on Android: an engine
   with nothing finalized answers `no-speech`/`client`/`nomatch`. Our state
   machine models "stopped without a final" as a TECHNICAL outcome with a
   finalize timeout; the last partial is never promoted.
6. **Sequential recordings** — by source: a fresh Android recognizer per
   attempt (destroyed on every completion path); iOS resets engine + task.
7. **Abort** — by source: cancel + `end`, no final, both platforms.
8. **Backgrounding** — policy: the app aborts the attempt on background
   (technical interruption, no penalty); iOS interruption errors also arrive
   from the session observers. Outstanding on device.
9. **Late callbacks** — by source: Android `destroy()` neuters the emitter;
   additionally OUR port drops any event whose attempt id is not active, so
   stale native events cannot mutate a newer attempt.
10. **Cleanup** — by source: per-attempt teardown on every terminal path.
11. **Phase-7 playback afterwards** — RISK identified by source (session
    left in `playAndRecord`/`measurement`); owned by our restore step
    (§5.3). Outstanding on device.
12. **Android recognizer destroyed** — by source: `teardownAndEnd()` on
    results, error, abort and destroy.
13. **iOS session restored** — NO, by source, at the provider layer; the
    app's coordination policy re-asserts playback mode after every attempt.
14. **Missing French offline model** — detectable (`getSupportedLocales`);
    `requiresOnDeviceRecognition` on an uninstalled locale surfaces as a
    recognition error; capability snapshot carries
    `frenchOnDeviceModelInstalled` and the UI degrades to disclosed
    network-backed mode or to unavailable.
15. **Denied/restricted permission** — by source: permission responses carry
    granted/denied/undetermined + `canAskAgain`; runtime denial surfaces as
    `not-allowed`. The capability snapshot gates every surface; speaking
    degrades to "Not now" with zero penalty.

**Adoption decision: ADOPT `expo-speech-recognition@56.0.4` (pinned, MIT)
behind the app-owned `SpeechRecognizerPort`.** The package is SDK-56-aligned
(its 56.0.0 line exists precisely for this Expo release), wraps exactly the
two platform recognizers this phase needs, absorbs two real platform defects
we verified in source (iOS 18 final-result regression; Android minified
release metadata), and exposes every capability the mandate requires
(on-device preference, n-best finals, per-attempt persisted recording,
punctuation, contextual strings — the last used ONLY in unscored practice).
A local Expo Module fallback remains the documented plan-B if a
reproducible defect emerges that cannot be handled behind the port; nothing
in this phase couples UI code to the package directly.
