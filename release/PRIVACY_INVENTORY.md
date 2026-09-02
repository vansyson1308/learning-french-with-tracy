# Runtime data-flow inventory (Phase 10 §41)

Every place learner data is read, written, kept, or could leave the device,
with the evidence in the source tree. This is the fact base for
`PRIVACY_POLICY.md`, `APP_PRIVACY.md` and `DATA_SAFETY.md`.

| # | Flow | What | Where it lives | Leaves the device? | Evidence |
|---|---|---|---|---|---|
| 1 | Learning progress | completed lessons, XP, streaks, FSRS cards (recognize / listen / speak), review log (ring buffer), mistakes, checkpoint attempts, placement result, settings (theme, goal, onboarding) | zustand `persist` → AsyncStorage key `progress-v2`, version 3 | No | `src/lib/store.ts`, `src/lib/persistence/migrations.ts` |
| 2 | Lexicon | read-only French dictionary | bundled SQLite asset (`assets/lexicon/*.db`) + JSON fallback on web; opened read-only | No | `src/lib/lexicon/*`, `src/content/lexicon/db-asset.ts` |
| 3 | Speech recognition | audio captured only after the learner taps record; recognized text (n-best) used to grade | OS speech service via `expo-speech-recognition`; on-device requested when `frenchOnDeviceModelInstalled`; otherwise the OS may use the platform provider's network service | **Possibly, by the OS** — never by the app; the app has no server | `src/lib/speech/expo-adapter.ts` (`requiresOnDeviceRecognition`), disclosure UI in `checkpoint/[id].tsx` and `speak-record-control.tsx` |
| 4 | Speech transcripts | interim/final transcripts | React state for the current attempt only; never in zustand / AsyncStorage / backups | No | `src/lib/speech/use-speech-attempt.ts`; `grep transcript src/lib/store.ts src/lib/persistence` → no hits |
| 5 | Attempt recordings | WAV of a practice attempt for own-voice replay (practice mode only, when `recordingPersistenceAvailable`) | `Paths.cache/speech-attempts/attempt-<id>.wav`; deleted per step and swept at session boundaries; scored checks never persist | No | `src/lib/speech/speech-cache.ts`, `speak-record-control.tsx:149` (`persistRecording: !scored && …`) |
| 6 | Audio playback | bundled MP3 clips + device TTS fallback | app bundle; `expo-speech` device synthesis | No (device TTS is an OS component) | `src/lib/audio.ts` |
| 7 | Backup export | JSON envelope (version 1) of flow 1 | written to the app's document directory then handed to the system share sheet, only on the learner's tap | Only where the learner sends it | `src/lib/persistence/backup*.ts`, `profile.tsx` Export row |
| 8 | Backup import | a file the learner picks | read via the system document picker; validated and migrated in a scratch state before commit; no partial writes | No | `backup-core.ts` (fail-closed validation) |
| 9 | External links | none opened; `Linking.openSettings()` only (system Settings for permissions) | — | No | `grep openURL src` → none |
| 10 | Network | none: no `fetch`, `XMLHttpRequest`, `WebSocket`, or HTTP client in `src` | — | No | `grep -rn "fetch(\|XMLHttpRequest\|axios\|WebSocket" src` → none |
| 11 | Tutor seam | `DisabledTutorProvider`; no credentials; no model calls; grading never imports the tutor | — | No | `src/lib/tutor/provider.ts`, `tutor-seam.test.ts` (import-graph + key scan) |
| 12 | Third-party SDKs | Expo, React Native, ts-fsrs, zustand, async-storage, gesture-handler, reanimated, screens, safe-area-context, expo-speech-recognition; **no analytics, ads, crash reporting** | — | No | `ls node_modules | grep -iE "analytics\|firebase\|sentry\|…"` → none |
| 13 | Logging | `console.info` of a migration COUNT; `console.warn` of an FSRS error object | dev console only | No | `migrations.ts:218`, `engine.ts:171`; no learner content logged |
| 14 | Identifiers | none: no device id, advertising id, account, or push token is read | — | No | `expo-device` is installed but not imported by app code (`grep -rn "expo-device" src` → none) |

## Consequences for the store forms

- Apple "collect" = transmitted off device and retained beyond servicing the
  request. Flows 1–2, 4–8, 11–14 never transmit. Flow 3 is a transmission by
  the operating system's own service, not by the app or a partner SDK the
  app embeds; Apple attributes OS-provided speech recognition to the
  platform, and the app receives only text it does not retain. Draft answer:
  **Data Not Collected** (see `APP_PRIVACY.md` for the reasoning and the
  reviewer note).
- Google "collection" = transmitting off the user's device. Same analysis;
  the app declares `RECORD_AUDIO`, so the Data safety form must explain that
  audio is processed by the OS speech service and is not collected by the
  developer (see `DATA_SAFETY.md`).
