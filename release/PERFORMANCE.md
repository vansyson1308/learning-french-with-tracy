# Performance, memory and stability record (Phase 10 §49-§53)

## What could be measured here (no device, no Xcode, no Android SDK)

| Measure | Phase 9 (SDK 56) | Phase 10 (SDK 57) | Δ |
|---|---|---|---|
| Web static export (directory) | 28 MB | 28 MB | 0 |
| Largest web JS chunk | 4.0 MB | 4.1 MB | +~0.1 MB (SDK 57 runtime) |
| Android Hermes bytecode (`expo export --platform android`) | 5,792,979 B | 5,763,725 B | −29,254 B |
| Lexicon SQLite asset | 118,784 B | 118,784 B | 0 |
| Bundled audio | 19 MB (1,024 files) | 19 MB | 0 |
| `bun run test` wall time | ~2.5 s (1,047 tests) | ~2.8–4.5 s (1,120+ tests) | more tests |
| `bunx jest` wall time | 6.1 s (68) | 6.1–7.1 s (69) | flat |
| Web export duration (sandbox) | — | 70 s cold / 9 s cached | — |

### P3g (2026-10-27) — size after per-course bundles and the phone ABI set

| Measure | Before (RC4, 3ff3b96) | After (P3g, 31f6856) | Gate |
|---|---|---|---|
| Web entry chunk | 7,366,281 B (single bundle) | **3,193,269 B** + one chunk per course (es-vi 1.76 MB, es-en 0.93 MB, fr-vi 0.57 MB, fr-en 0.50 MB, `-en` legacy packs 0.06–0.08 MB) | ≤ 4.5 MB (`scripts/check-web-entry.ts`, CI `export-size`) |
| Android release APK | universal 133,664,309 B (arm64-v8a, armeabi-v7a, x86, x86_64) | **phone APK 83,997,585 B** (arm64-v8a 23.3 MB + armeabi-v7a 16.0 MB native libs; shared 44.0 MB of which audio 13.1 MB), SHA-256 `24c8b893…f836`, unsigned, `plan/scripts/build-phone-apk.sh` | < 100 MB (P3g C); v1.0: arm64 ≤ 150 MB |
| Hermes bundle in the APK | — | `assets/index.android.bundle` 6,789,432 B (all courses compiled in; on native the course modules are evaluated on first use, not at start-up) | — |

Cold start is measured by the P3h emulator suite (`am start -W`, budget ≤ 3.5 s on the API 34 emulator); no phone measurement exists.

### P3h (2026-10-27) — emulator measurements (x86_64 release APK, API 34 google_apis, swiftshader, owner's PC)

| Measure | Value | Gate |
|---|---|---|
| Cold start (`am start -W` TotalTime, median of 5 after a discarded first launch) | 2,194 ms (earlier runs: 3,458 ms, 2,864 ms) | ≤ 3,500 ms (`ENFORCE_COLD_START` on API 34 in CI) |
| Memory, `dumpsys meminfo` TOTAL PSS on the Learn tab | ~159–164 MB | recorded, no gate |
| x86_64 release APK | 69.2 MB | — |

Emulator figures only. They show regressions relative to each other and say nothing about a real phone (see OWNER-FINAL-CHECKLIST D).

The Hermes V1 memory regression fix (Gate 0) is the one memory change
this phase could make with certainty: the affected engine build is no
longer shipped. Absolute memory, cold/warm start (TTID/TTFD), path
scrolling and audio/speech memory behaviour **could not be measured** in
this environment and are recorded as NOT TESTED in
`NATIVE_ACCEPTANCE.md`. The CI Android build reports the APK size.

## Resource-lifecycle audit (JS level, evidence in source)

| Resource | Where | Lifecycle | Verdict |
|---|---|---|---|
| Recording elapsed-time interval | `use-speech-attempt.ts:179` | `setInterval(…, 250)` cleared in the effect's cleanup | no leak |
| Finalize timeout | `use-speech-attempt.ts:234` | ref-tracked; `clearTimeout` on supersede and on unmount | no leak |
| Match wrong-flash timeout | `match.tsx:72` | 600 ms one-shot that clears a Set; React ≥18 ignores state updates after unmount | benign |
| AppState subscriptions | `use-listening-player.ts:66`, `use-speech-attempt.ts:151`, `session/controller.ts:88` | each returns `sub.remove()` from its effect | no leak |
| Native speech-event subscriptions | `speech/expo-adapter.ts:98-101, 301-304` | registered once per adapter, all removed in `dispose()`; `disposed` + `activeAttemptId` guards drop stale native callbacks | no leak; stale-callback safe |
| Audio players | `useAudioPlayer` in `speak-record-control.tsx`, `interaction-scenario.tsx`, `use-listening-player.ts`; `createAudioPlayer` for sfx in `audio.ts` | expo-audio hook players are released on unmount; sfx players are module singletons (created once) | bounded |
| Speech attempt recordings | `speech-cache.ts` | deleted per step, swept at session boundaries; cache dir only | bounded, OS-clearable |
| SQLite | `lexicon/native-loader.native.ts:48-56` | opened, read, `closeAsync()`; repository is a singleton | bounded |
| Review log | `store.ts` ring buffer | capped at 10,000 entries (Phase 1) | bounded |
| Checkpoint attempts | `assessment/types.ts` | capped at 5 per checkpoint | bounded |
| AsyncStorage blob | zustand persist | whole-blob write per mutation (Phase 0 design); size grows only with the capped structures above | bounded |

## Soak test design (device task)

The repeated-session soak (§50) needs a device profiler. Script, in order,
each ×20: open/close a lesson; run TODAY; play 30 listening clips; record
20 speech attempts (practice, then scored); open the Vocabulary browser
and search; run an interaction scenario; background/foreground. Record
Xcode Memory Report / Android Studio Memory Profiler after each block;
pass criterion: no monotonic growth beyond the first block's plateau, and
the `speech-attempts` cache directory empty after each session.

## Startup

TTID/TTFD were not measurable here. Decision per §51: **no Baseline
Profile / Startup Profile pipeline is added** — measure first on device;
adopt only if a measured cold start justifies the added build complexity.
Nothing in the app does work at launch beyond hydrating the persisted
store (a single AsyncStorage read gated by a hydration flag) and lazy
lexicon opening on first use.

## Low-end behaviour (code review)

- Slow storage: the store hydrates behind a splash/hydration gate; no
  screen renders learner data before hydration.
- Low memory / restore: session state is in-memory by design (an
  interrupted scored sitting is not recorded — nothing partial is ever
  persisted); TODAY and PATH re-derive from the store.
- Small screens: layouts are flex/scroll; no fixed-height text containers
  (see the accessibility audit).
- Offline: the app makes no requests; the only network-dependent feature
  is the OS speech service on devices without an on-device French model,
  which is disclosed and skippable.
