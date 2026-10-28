# Asset delivery plan — audio beyond four languages (P3f)

**Status: plan only. Nothing here is implemented yet.** Every language's audio is
bundled in the APK/IPA today.

## Projection and decision (QC 2026-10-29 §1.6, 2026-10-29)

### Method
- **Projected sizes are estimates, not measurements.**
- Byte rates are measured on the committed assets: es at pipeline 3/4, fr at pipeline 1.
  - Words: 443 B per character.
  - Clips at 32 kbps: 286 B per character.
  - Story sentences at 24 kbps: 220 B per character.
  - French, frozen at 64 kbps: words 764, clips 530, stories 493 B per character.
- These rates are applied to the characters of each language's `audio.ts plan`.
- Stories are projected to 45 per language, the 40–50 target of QC 2026-10-28 §4.

### Projected bundled audio per language (budget 12 MB)

| Language | Words (pack + syllabus) | Clips | Stories now | Stories at 45 | Total at 45 | Without story audio |
|---|---|---|---|---|---|---|
| fr (64 kbps, frozen) | 1.33 MB | 2.86 MB | 10 = 3.92 MB | 17.66 MB | **21.9 MB** | 4.2 MB |
| es | 4.67 MB | 2.70 MB | 20 = 3.45 MB | 7.76 MB | **15.1 MB** | 7.4 MB |
| de | 4.89 MB | 2.30 MB | 43 = 10.16 MB | 10.64 MB | **17.8 MB** | 7.2 MB |
| it, pt, ja, zh, ko, en (de-like, each) | ≈ 4.9 MB | ≈ 2.3 MB | — | ≈ 10.6 MB | **≈ 17.8 MB** | ≈ 7.2 MB |

- **Words** grow with the syllabus (about 700 lexemes).
- **Stories dominate.** A German story averages about 0.24 MB: 21 sentences of about 50 characters.

### Phone APK size against the 150 MB v1.0 budget
- **Today:** the RC4 APK is 84.0 MB with 21.6 MB of audio, so about 62 MB is not audio.
- **With story audio:** all 9 courses at 45 stories carry about 162 MB of audio, so the APK would be about **224 MB**. That is over budget.
- **Without story audio:** about 62 MB of audio, so the APK would be about **124 MB**. That is within budget.

### What the QC options give
- **(a) Opus mono 24 kbps for long reception and story clips:**
  - Clips: −25 % (32 → 24 kbps), about −0.6 MB per language.
  - Stories: about 0 %, since they are already 24 kbps.
  - Result: de at 45 stories ≈ 17.2 MB. **Not enough.**
- **(b) Lexicon example sentences via device TTS only:** already the case since P3f; only headwords are bundled. **No gain.**
- **(c) Per-language asset packs:** the only option that keeps the base APK under 150 MB with read-along stories in every language.
  - Install-time packs still download every language, so the pack must be fast-follow or on-demand.
  - That is the app's first network action, behind a consent screen (non-negotiable 1). The plan is in the sections below.

### Decision (not a silent budget change)
1. **The 12 MB per-language budget stays.** It is checked by `audio:check`, and it now covers words and listening clips only.
2. **Story sentence audio is not bundled.**
   - It is switched off in the language's reception manifest with a reason (`storyAudio: { bundled: false, reason }`; `scripts/audio.ts plan` skips story sentences).
   - Without audio the reader offers text only. "Listen" appears only when every sentence of a story has audio.
3. **de-vi ships this way first**: words + clips ≈ 7.2 MB.
   - es and fr keep their already-bundled stories (es 10.8 MB, fr 8.1 MB: within budget).
   - The es and fr story top-ups are text-only until step 4.
4. **Story audio moves to the per-language asset pack milestone** (option c, with Opus for story sentences inside the pack).
   - It is proved on the emulator: playback events, no decoder errors, slow mode intelligible.
   - It runs before P3d(it) generates its audio.
   - The owner checklist records the consent copy as part of that milestone.

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
