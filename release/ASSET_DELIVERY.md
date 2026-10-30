# Asset delivery — bundled audio for nine courses (P3f, QC 2026-10-29b §2)

## Decision for v1.0
1. **v1.0 depends on no network and on no Play Asset Delivery.** Every byte of
   audio the app plays is inside the APK/IPA. The owner's one acceptance pass
   is a sideloaded APK, and non-negotiable 1 (no network by default) holds.
2. **Play Asset Delivery / iOS On-Demand Resources is a documented post-v1.0
   store option**, not scheduled before P3d(it). The design is kept below
   ("Post-v1.0 option") so it can be picked up later; nothing of it is built.
3. **Story audio is bundled for the band-1 stories only**: the first 10–12
   stories of each course's reading order (band, then authored order), the
   ones a beginner needs most to hear.
4. **Every other story is read with the device voice** (expo-speech),
   sentence by sentence with the same highlight, offline. The reader labels
   it honestly **"Giọng đọc của máy"**. When no voice for the language is
   installed, the story is text-only, with a one-line hint to install the
   offline voice in Android settings; the app makes no request.
5. The 12 MB per-language cap stays, and a **total cap of 88 MB** over all
   languages is new. Both are checked by `audio:check`; nothing is raised
   silently.

## The budget arithmetic
The binding constraint is the **150 MB phone APK**.

| | MB |
|---|---|
| Phone APK budget (v1.0) | 150 |
| Not audio: RC4 APK 84.0 MB − 21.6 MB audio | ≈ 62 |
| **Audio for all courses** (150 − 62) | **≈ 88** |
| Per course, 9 courses (fr, es, de, it, pt, ja, zh, ko, en): 88 / 9 | **≈ 9.5–10 on average** |
| Per-language cap (any one course) | 12 |

- `audio:check` sums the bundled audio of every language
  (`assets/audio/<lang>` + `assets/audio/<lang>-reception`) and fails above
  the total cap; it prints one line per language and the total.
- The caps live in `content/audio/size-budget.json` (`perLanguageBytes`
  12 000 000, `totalBytes` 88 000 000). A change is a reviewed commit to that
  file and to this document.
- `content/reports/audio-size.json` records the sizes and both caps.

## Which stories bundle audio
Declared per language in `content/<lang>/reception/audio-source-manifest.json`:

```json
"storyAudio": { "bundled": "band-1", "stories": ["<story id>", "…"], "reason": "…" }
```

- `scripts/audio.ts plan` plans sentence audio for the listed stories only;
  the next run's `apply` prunes the sentence audio of any other story.
- The validators require the sentence assets of the listed stories only.
  Every other story validates without audio. The list is checked: at most
  12 stories, known ids, no repeats, and a warning when it is not the start of
  the reading order (a new early story was added).
- The compiled stories (`src/content/stories/<course>-stories.json`) carry
  `audio: "bundled" | "device-voice"` per story. It is "bundled" only when the
  story is listed and every sentence asset is committed. The reader uses that
  field to choose the bundled player or the device voice.
- `{ "bundled": false, "reason": "…" }` (no story audio) and an absent field
  (all stories, legacy) are still accepted.

| Course | Stories | Band-1 bundled | Sentences | Story audio | Language total |
|---|---|---|---|---|---|
| fr (64 kbps, frozen) | 10 | all 10 (unchanged) | 215 | 3.92 MB (measured) | 8.11 MB (measured) |
| es (24 kbps stories) | 20 | first 12 (8 A1-1 + 4 A1-2) | 280 | ≈ 2.1 MB | ≈ 9.4 MB after the next es run (10.82 MB today) |
| de (24 kbps stories) | 43 | first 12 (3 A1-2 + 9 A2-1) | 271 | ≈ 2.5 MB (projected) | ≈ 8.1 MB after the next de run (5.63 MB today) |
| it (Opus 16 kbps stories) | 46 | first 18 (2 A1-1 + 16 A1-2) | 359 | included in the reception total of 4.51 MB (measured) | 10.3 MB (measured) |
| pt, ja, zh, ko, en | — | first ≤ 18 each | — | ≈ 2–2.5 MB each (projected) | ≈ 9.5 MB each (projected) |

- Measured is from the committed assets; projected is 220 B per character,
  measured on the committed es story sentences at 24 kbps.
- Projected total for nine courses: ≈ 8.1 + 9.4 + 8.1 + 6 × 9.5 ≈ **83 MB**,
  under the 88 MB cap. Today's committed total is 25.3 MB.
- es: the 8 stories after the band-1 list lose their bundled audio
  (≈ 1.4 MB) and are read with the device voice. The es story top-up
  (QC 2026-10-29b §4) adds text-only stories.

## Opus for story sentences: adopted 2026-10-30 (CI-proven)
**Decided: story sentences of es and de ship as Opus 16 kbps; French stays
MP3.** The playback check passed in one CI run (PR #51, head 89e3be8):

| Where | Run | Result |
|---|---|---|
| device-acceptance `lessons`, API 30 | 40938703786 | `LFT_DIAG_OPUS verdict=pass`; normal: loaded, playing, finished at rate 1; slow: rate 0.85, finished; error=none; 2.549 s |
| device-acceptance `lessons`, API 34 | 40938703786 | `verdict=pass`, same events; error=none |
| ci.yml "Opus playback E2E (web tier)" | 40938703758 | 12/12 checks, verdict PASS at rate 1 and slow mode; no decoder or page error |

The release web export held no diagnostics route and no Opus fixture.
iOS playback of Ogg Opus is still **not** checked. The switch below is
Android and web only.

The rest of this section is kept as the record of how the decision was made.

Sizes measured on 2026-10-29 with ffmpeg 7.1 and libopus (mono, VBR,
`-application voip`). The sample was 60 committed story sentences per
language, transcoded from the shipped MP3. A transcode measures size only,
not quality.

| Sample | Seconds | MP3 now | Opus 16 kbps | Opus 20 kbps |
|---|---|---|---|---|
| es, 60 sentences (MP3 24 kbps) | 144.8 | 448 034 B (7 467 B/sentence) | 296 566 B (−34 %) | 360 483 B (−20 %) |
| fr, 60 sentences (MP3 64 kbps) | 137.0 | 1 111 396 B (18 523 B/sentence) | 280 336 B (−75 %) | 341 828 B (−69 %) |

What it would buy, if playback is verified:
- **At 16 kbps**, the same bytes bundle about 1.5× the stories: es 12 → about 18.
- **For de**, band-1 story audio drops from ≈ 2.5 to ≈ 1.65 MB.
- **For French**, story audio drops from 3.92 to about 1 MB. French is frozen,
  so that would be a deliberate French change.

### The playback check (built 2026-10-29, not yet run in CI)
One Opus file is played through the app's real audio path:
`assets/diagnostics/opus/story-sentence-16k.opus`, encoded with
`ffmpeg -c:a libopus -b:a 16k -ac 1` from the committed story sentence
`fr.story.le_chat_et_la_souris#1`. The hashes and the exact command are in
`content/audio/diagnostics-fixtures.json`, and the registry entry is
`acceptance-diagnostics-fixtures` (test-only, the source voice's CC-BY-4.0).

- **The screen.** `src/app/diagnostics/opus.tsx` uses the same expo-audio
  hooks as the story reader. It plays the clip at rate 1, then again at the
  listening player's slow rate (0.85, pitch-corrected). The verdict logic is
  `src/lib/diagnostics/playback-probe.ts`. For each pass it needs `loaded`,
  `playing` and `finished` and no player error. When the player reports a
  rate, it must be the requested one. A pass that does not finish within
  30 s fails.
- **Never in a release build.** `metro.config.js` blocks
  `src/app/diagnostics/` and `assets/diagnostics/` unless the build sets
  `LFT_ACCEPTANCE_DIAGNOSTICS=1`. `scripts/check-diagnostics-export.ts` looks
  for the fixture's bytes and the route's marker strings, and proves it:
  - `--absent` runs on the CI web export (`ci.yml` export-size), on the
    release QA APK (`android-release-build.yml`) and on the EAS RC APK
    (`eas-build.yml`);
  - `--present` runs on the device-acceptance APK and on the diagnostics web
    export.
  Locally on 2026-10-29: the plain web export holds neither; the flagged one
  holds both.
- **Device.** `device-acceptance.yml` builds its x86_64 release APK with
  `LFT_ACCEPTANCE_DIAGNOSTICS=1`. The `lessons` shard runs
  `diagnostics-opus.yaml` on API 34 and API 30, and its logcat scan fails on
  any ExoPlayer, MediaPlayer or AudioTrack error. The report row is "opus
  playback: loaded, playing, finished at 1.0 and slow, no decoder error",
  plus the app's `LFT_DIAG_OPUS` line.
- **Web.** `ci.yml` makes a second export with the flag (`dist-diag`) and
  runs `bun run e2e:opus dist-diag`. Locally in Chrome on 2026-10-29: 12/12
  checks passed. The fixture was served as `audio/ogg`, both passes loaded,
  played and finished, there was no error, and the verdict was PASS. That is
  a local browser result, not CI and not a device.
- **Not checked:** iOS. AVPlayer support for Ogg Opus is not established.
  The switch below must not be read as covering iOS.

### What flips once CI proves playback
Flip only after one CI run shows all three of these green: device-acceptance
`lessons` on API 34, `lessons` on API 30, and the ci.yml "Opus playback E2E
(web tier)" step. Each must have the opus row as PASS, not INFO.

1. In `content/audio/engines.json`, set `encoding.codecByLayer.story` from
   `"mp3"` to `"opus"`. This is the only switch. Keep `opusKbps` at 16; the
   range is 16–20. `codecProblems` (scripts/lib/audio-codec.ts) refuses
   opus for any other layer, and refuses to drop `"fr"` from
   `mp3OnlyLanguages`.
2. Everything else follows from that one value:
   - Story sentence keys gain the recipe `opus-16k`, so every non-French
     story sentence gets a new key.
   - The files become `<key>.opus`: Ogg Opus, 24 kHz, mono, 16 kbps, voip
     mode, after the same loudnorm.
   - The next audio run (`audio.yml`, generate, layer reception, per
     language) renders them, and tech-qa checks them, clipping included.
   - The ASR audit reads `.opus`. `apply` copies them, writes `codec` into
     `generated-plan.json`, and removes the superseded `.mp3` story files.
   - The compiler maps `<key>.opus` in `<lang>-story-assets.ts`.
   - `audio:check` counts `.opus` towards both caps, and Metro bundles
     `.opus` (`assetExts`).
3. **French does not change.** `mp3OnlyLanguages: ["fr"]` keeps French story
   audio as MP3, byte-identical. Moving French to Opus (3.92 MB → ≈ 1 MB) is
   a separate, deliberate French change: it needs an RC_HISTORY entry and a
   golden re-bless.
4. **Then use the room.** Lengthen the `storyAudio.stories` band-1 lists, at
   about 1.5× the stories for the same bytes, and keep them within the
   per-language 12 MB and the total 88 MB caps. One more reviewed change
   lifts `STORY_AUDIO_MAX_BUNDLED` (12) in `scripts/lib/stories.ts`.
5. Record the switch in `release/RC_HISTORY.md`, because the APK content
   changes, and re-run device acceptance on the new RC.

**Done 2026-10-30 (PR stories-topup-es):**
- step 1: `codecByLayer.story` is `"opus"`;
- step 3: French is unchanged;
- step 4: the band-1 lists for es and de are 18 stories each, after the A1-0 micro-stories (read with the device voice), and `STORY_AUDIO_MAX_BUNDLED` is 18;
- step 5: recorded in `release/RC_HISTORY.md`.

The es and de audio runs render the `.opus` files. Their sizes and
`audio:check` results are in that PR.

## Fallbacks without bundled audio
- **Stories outside band 1:** the device voice, labelled "Giọng đọc của máy".
  With no installed voice: text only, plus the hint.
- **Lessons and listening clips:** always bundled. Scored listening never uses
  the device voice (P7 §25–26).
- **Lexicon example sentences:** the device voice, as since P3f.

## Post-v1.0 option: per-language asset packs (not scheduled)
Revisit only after v1.0 ships, and not before P3d(it). It becomes relevant
when the store build should carry more story audio than band 1 within the
150 MB base.

### Android: Play Asset Delivery
- **Packs.** One on-demand asset pack per target language (`audio_es`,
  `audio_de`, …) holds the stories beyond band 1. The base keeps everything
  v1.0 ships, so the app stays fully offline without any pack.
- **Consent.** Downloading a pack is a network action, so it needs:
  - a consent screen;
  - a `release/PRIVACY_POLICY.md` + `src/lib/privacy-policy.ts` change and its test;
  - a Data-safety note.

  The request goes only to the Play Store, with no analytics.
- **Integrity.** A downloaded pack is checked against the manifest hashes before use.
- **Expo.** A config plugin moves the pack folders into
  `android/<pack>/src/main/assets` at prebuild. A small native module, or a
  library under an allowed licence, makes the `AssetPackManager` requests.
- **Testing without the store.**
  - Build: `bundletool build-apks --local-testing --bundle app.aab --output app.apks`.
  - Install: `bundletool install-apks --apks app.apks`.
  - Device checks: pack absent → device voice; pack present → bundled clips;
    airplane mode after the download → still plays; pack removed → device voice.

### iOS
On-Demand Resources tags, one per language, with the same consent and fallback.
