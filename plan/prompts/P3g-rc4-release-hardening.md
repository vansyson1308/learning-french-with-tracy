# P3g — Release-grade technical hardening for RC4 (coordinator QC 2026-10-22, PR #40 @ 8d412e9)

Do this on `phase-3/es-vi-hardening` (or a follow-up branch if #40 is merged first). Goal: RC4 is a build we would be comfortable shipping to testers — green CI, sane size, fast start, safe upgrade. Short Vietnamese report after each block.

## Current state observed
- CI on 8d412e9: 6/7 check jobs green; `checks (UTC)` fails only at **Audio baseline check**: `bundled audio for es is 35.2 MB (2510 files), over the 12 MB budget` — expected until the 32 kbps regeneration lands, but see A.
- Web export entry bundle is **7.8 MB** (4,568 modules); `src/content/audio-manifest.ts` is 262 KB of static `require()`s. Every course's pack/artifacts/audio map is loaded at start-up.

## A. Audio must really fit — decide before the regeneration finishes
Estimate after P3f B: es-vi pack (~700 clips) + syllabus words (613) + syllabus examples (~613) + reception (255 longer clips) at 32 kbps ≈ 18–22 MB — likely still over 12 MB.
1. When the run finishes, read `content/reports/audio-size.json`. If es > 12 MB, apply in this order until it fits: (a) **lexicon example sentences are unscored → play them with device TTS**, bundle only the headword audio; (b) drop the 2,510 orphaned 64 kbps `es-en` lexicon clips from the baseline (es-en keeps only its pack clips); (c) only then consider 24 kbps. Do not raise the budget silently; if you must, write the reason and the per-language arithmetic in `release/ASSET_DELIVERY.md`.
2. Prove no orphans: every file under `assets/audio/**` is referenced by a manifest, and every manifest entry has a file (test).
3. Device check (in D): 32 kbps clips play on expo-audio without artefacts; slow mode (0.85×) still intelligible.

## B. Start-up and bundle size
1. Split content per course: packs, course artifacts and the audio map become per-course modules loaded on demand (`src/content/packs/<id>.json`, `src/content/audio/<courseId>.ts`), with a synchronous registry for the active course only; switching course loads the next one. Keep Metro-static `require()`s inside each per-course module.
2. Add a CI size gate in `export-size`: fail if the web entry bundle > 4.5 MB (report the Android Hermes bundle size from the release build in the RC record too).
3. Measure cold start on the phone in D (target ≤ 3 s to the Learn tab on the owner's Oppo); record in `release/PERFORMANCE.md`.

## C. APK shape for sideload testing
Build RC4 with `-PreactNativeArchitectures=arm64-v8a,armeabi-v7a` (no x86/x86_64 on a phone APK) and record the size per ABI; the store build later is an AAB with ABI splits. Target APK < 100 MB. Note the difference from the CI universal QA APK in `RC_HISTORY.md`.

## D. RC4 build + device acceptance (owner present)
1. `bun run release:bump` (build 2), tag on the built commit after CI is green (owner pushes `v1.0.0-rc.4`).
2. Build locally; the owner signs with `out\ky-apk.cmd` (update it for rc.4 and for the arm64/armeabi APK path); write `out\rc.4-signing-report.txt` — **signer SHA-256 must equal RC3's** (`d280d1de…3182`).
3. Owner checklist in Vietnamese (≤ 20 min), recorded in `release/DEVICE_ACCEPTANCE.md`:
   - Install **over RC3** (no uninstall): progress, streak, FSRS cards and placement from RC3 still there (migration v4/v5 on a real device).
   - Cold start time; airplane mode for the whole session (the app must work fully offline).
   - Vietnamese UI end to end; fr-vi lesson; es-vi lesson with audio; slow audio; daily words in Today; vocabulary search ("café"/"cafe", "año"/"ano").
   - Speaking in Spanish: does the Oppo's recogniser offer es-ES (on-device or online)? If not, the app must show the honest "not available" panel and Skip, not fail.
   - DELE mock: one timed reading section, listening plays twice, speaking task 1; result shows the two group scores and "mức sẵn sàng ước tính".
   - Backup export → clear app data → import → everything back.
   - App size in Settings → Apps.
4. Any P0/P1 found → fix → RC5 (same key), never ship an RC with an open P0/P1.

## E. Release hygiene checks (automated where possible)
- Privacy: the APK still declares only INTERNET, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, VIBRATE; no new network code paths (grep test for `fetch(`/`XMLHttpRequest`/`WebSocket` outside allow-listed modules).
- Licences screen lists every shipped voice/engine/data source (Kokoro voices, Piper voices, kaikki/Wiktextract, FrequencyWords/wordfreq, Lexique 4); LanguageTool is CI-only and must not appear in the app bundle (test).
- `KNOWN_LIMITATIONS.md` lists: es-vi beta (review pending), ko audio status, DELE readiness is an estimate.
- STATUS/RC_HISTORY/PUBLICATION_STATUS updated with the RC4 facts.

## Definition of Done
#40 merged with 12/12 green including the audio budget; per-course lazy content; web entry ≤ 4.5 MB; RC4 (arm64+armeabi) signed with the RC3 key, installed over RC3 on the owner's phone, checklist recorded with zero open P0/P1. Then continue with P4a.
