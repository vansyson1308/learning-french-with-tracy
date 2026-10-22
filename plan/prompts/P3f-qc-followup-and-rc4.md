# P3f — QC follow-up of PR #40, size budget, RC4 on the phone

Coordinator QC 2026-10-22 of `phase-3/es-vi-hardening` @ b62bd5c. Do these on the same branch before merging #40, then cut RC4. Short Vietnamese report to the owner after each block.

## A. Blocking — CI is red (typecheck)
1. `src/content/audio-manifest.ts` has ~60 duplicate object keys (TS1117) since the bot commit 768d9d62 (`audio(es): generate`): the lexicon layer and the pack layer emit the same `"<course>:<text>"` key. Fix the generator in `scripts/audio.ts apply`: merge per key; identical asset → one entry; different assets for one key → pack wins and the run fails if the texts differ in normalisation, with a test reproducing a pack/lexicon collision. Regenerate the manifest; `tsc` must be clean.
2. `scripts/ci/bot-commit.sh` let a non-compiling tree through: add `bun run typecheck` (and `bun run lint`) to its gate list, and update CLAUDE.md rule 10 accordingly.
3. `ci.yml` `workflow_run` runs are reported against `main` while testing the bot commit of a feature branch (run 39735730088 shows "main" red but tested b1413ce's sibling commit). Restrict the `workflow_run` trigger to `workflow_run.head_branch == 'main'`; feature branches get CI from their own push/PR events.

## B. Audio size — the APK cannot carry 8 languages at this rate
`assets/audio/es` is already 39 MB (2,688 lexicon clips at 64 kbps) before the es-vi pack and reception layers; 8 languages at this rate ≈ 350 MB.
1. Lexicon audio only for syllabus members (613 for es), not the whole 887-lexeme lexicon + every example.
2. Encode speech at **32 kbps mono MP3** for new languages (keep French files untouched — frozen keys); verify on device that expo-audio plays them; document in `release/AUDIO_PROVENANCE_FINAL.md`.
3. Add a size gate: per-language bundled audio ≤ 12 MB (fail `audio:check` above it), report total in `content/reports/audio-size.json`.
4. Write `release/ASSET_DELIVERY.md`: plan for Play Asset Delivery (per-language on-demand packs) once > 4 languages ship; note sideload testing via bundletool. Do not implement PAD yet.

## C. Content gaps still open after P3e
1. **Daily words are mostly context-free:** 328 of 613 syllabus entries fall back to `unit-1` (no unit teaches them or their topic) and only 135 lexemes appear in exercises. Add a `topic → unit` map authored per course (`content/es/lexicon/topic-units.json`) so the fallback is thematic, and make the linter report "syllabus lexemes with no example sentence in any lesson/reading/story" — target 0 by the end of P5b (graded stories, which now moves up: see roadmap).
2. `vosotros` forms are absent from `content/es/pedagogy/paradigms.json` (P3e §4 asked for recognition-level teaching): add the vosotros cells to the paradigms of ser/estar/tener/ir/hablar/comer/vivir, one concept card "vosotros (Tây Ban Nha) / ustedes (Mỹ Latinh)", and 4–6 recognition exercises; accept ustedes answers in production.
3. Pack still has `boleto` ×1 and `coche` vs planned variety — run the variety linter as an error and fix.
4. DELE `formatSource.checkedAgainstOfficialGuide`: the coordinator fetched and checked both official PDFs on 2026-10-22 (Guía de examen DELE A1 v2020; Especificaciones DELE A1 2020) — structure, durations, item counts, formats and the 30/50-per-group rule match the current file. Set `checkedAgainstOfficialGuide: true`, `checkedBy: "coordinator (owner-delegated)"`, `checkedAt: "2026-10-22"`, keep the three URLs, and remove the in-app "not verified" note. Add "each listening recording plays twice" explicitly to the listening section (`playCount: 2`) if the engine does not already enforce it.

## D. RC4 on the phone (nothing has been device-tested since RC3)
Since RC3: SQLite learner store + migration v4/v5, i18n Vietnamese UI, fr-vi, es-vi (712 exercises), exam track, daily words, ~3k new audio files. After #40 is green and merged:
1. `bun run release:bump` → build 2; local Windows build per `plan/04-AUDIT-BUILD-RELEASE.md` (note: the Android SDK lives under Claude's package-virtualised path `C:\Users\MSI\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Local\Android\Sdk` when seen from the owner's own terminal — use `out\ky-apk.cmd` style signing script with that path; keystore `C:\keys\lft-upload.jks`). The owner signs; record APK size per ABI.
2. Upgrade test: install RC4 **over** RC3 (same key) — progress from RC3 must survive (migration v4/v5 on a real device).
3. Give the owner a 15-minute Vietnamese checklist: onboarding in Vietnamese; fr-vi lesson; es-vi lesson with audio; daily words in Today; DELE mock (one timed section + speaking task); backup export/import; app size and cold-start time. Record results in `release/DEVICE_ACCEPTANCE.md` and `RC_HISTORY.md`.

## E. Roadmap changes (coordinator decisions)
- **P5b graded stories moves before P3d(de/it/pt)** — it is the context layer the daily-words stream needs, and it is reused by every language.
- **P4b gains Hán-Việt readings**: show the Sino-Vietnamese reading for every kanji/hanzi/hanja word (e.g. 学生 → học sinh; 図書館 → đồ thư quán; 학생 學生 → học sinh), sourced from Unicode Unihan `kVietnamese` (Unicode licence — verify and register) plus a reviewed override list. This is the single biggest advantage a Vietnamese learner has for ja/zh/ko and no competitor uses it systematically; add a concept card per course explaining how to use it and a lint rule that every CJK lexeme with Han characters carries a Hán-Việt reading or an explicit "none".
- Update `plan/08-ROADMAP.md` and `plan/STATUS.md` accordingly.

## Definition of Done
CI 12/12 green on #40 with typecheck; manifest generator fixed with test; bot-commit gate includes typecheck/lint; workflow_run restricted to main; audio size gate + 32 kbps + syllabus-only lexicon audio, es re-generated within budget; vosotros + variety fixed; DELE marked checked; #40 merged; RC4 built, signed by the owner, upgrade-tested over RC3, checklist results recorded; roadmap/STATUS updated. Then continue: P4a → P5b → P3d(de/it/pt) → P4b (with Hán-Việt) → P4c–f → P5 rest → P6.
