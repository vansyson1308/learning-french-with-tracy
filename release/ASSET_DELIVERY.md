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
| it, pt, ja, zh, ko, en | — | first ≤ 12 each | — | ≈ 2–2.5 MB each (projected) | ≈ 9.5 MB each (projected) |

- Measured is from the committed assets; projected is 220 B per character,
  measured on the committed es story sentences at 24 kbps.
- Projected total for nine courses: ≈ 8.1 + 9.4 + 8.1 + 6 × 9.5 ≈ **83 MB**,
  under the 88 MB cap. Today's committed total is 25.3 MB.
- es: the 8 stories after the band-1 list lose their bundled audio
  (≈ 1.4 MB) and are read with the device voice. The es story top-up
  (QC 2026-10-29b §4) adds text-only stories.

## Opus for story sentences: measured, decision pending playback check
**Decision pending playback check.** MP3 stays the shipped format. Opus is
adopted only when CI shows expo-audio (Media3) playing it on emulator API 30
and API 34 and in the web build: playback events, no decoder error, slow mode
intelligible. iOS playback of Ogg Opus is not checked either. None of this has
been run, so nothing here claims that Opus plays.

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
