# Asset delivery plan — audio beyond four languages (P3f)

**Status: plan only. Nothing here is implemented yet.** Every language's audio is
bundled in the APK/IPA today.

## The problem
Bundled speech per language, after P3f (32 kbps mono, syllabus-only lexicon
layer, `content/reports/audio-size.json`):

- About 7–8 MB for a full Vietnamese-native course such as `es-vi` (two lesson
  packs, about 600 syllabus words, 255 listening clips).
- 4.2 MB for French (frozen at 64 kbps).

Eight full languages would add about 60 MB of audio. Play allows a 200 MB AAB
download (base module ≤ 150 MB), but most learners study one or two languages,
so they should not download the rest.

`audio:check` caps each language at **12 MB**. The cap keeps any one language
honest; it does not cap the total.

## Trigger
Implement on-demand delivery when **more than four languages** ship with
bundled audio (today: fr, es, plus small de/pt legacy packs), or when the
measured universal APK passes 120 MB (RC4 baseline: see `release/RC_HISTORY.md`).

## Android: Play Asset Delivery
- One **on-demand asset pack per target language** (`audio_es`, `audio_de`, …). Each
  pack holds `assets/audio/<lang>` and `assets/audio/<lang>-reception`. French
  and the sound effects stay in the base module (`install-time`), so the first
  launch works offline.
- Download the pack when the learner picks the course, with a progress screen.
  This is the app's first network action, so it needs consent and copy that
  follow non-negotiable 1:
  - The request goes only to the Play Store; no analytics.
  - Update `release/PRIVACY_POLICY.md`, `src/lib/privacy-policy.ts` and its test.
  - Add a Data-safety note.
- Without the pack, the course keeps working through the device voice
  (`audio.policy` fallback already exists). A downloaded pack is checked against the
  manifest hashes before use.
- Expo: a config plugin that moves the per-language folders into
  `android/<pack>/src/main/assets` at prebuild, plus a small native module (or
  `expo-asset-delivery`-style library under an allowed licence) for
  `AssetPackManager` requests. The `require()`-based `audio-manifest.ts` becomes a
  map to pack-relative paths for non-base languages.

## iOS
On-Demand Resources tags, one per language. Same consent and fallback as Android.

## Testing without the store
- Build the AAB, then `bundletool build-apks --local-testing --bundle app.aab --output app.apks`.
- Install with `bundletool install-apks --apks app.apks`; with `--local-testing`
  on-demand packs install from the device's local storage, so the download
  flow can be exercised by sideloading.
- Device checks:
  - Pick a course with no pack: the device voice plays.
  - Download the pack: bundled clips play.
  - Airplane mode after the download: the clips still play.
  - Remove the pack: the app falls back to the device voice again.

## Not now
No PAD, no ODR, no network code in this milestone. The size gate and the
32 kbps encoding are the measures in force.
