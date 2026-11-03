# P4b: CJK language plugins and Hán-Việt readings

Branch `phase-4/cjk-plugins`. Prompt: `plan/prompts/P4b-cjk-language-plugins.md`. Licence and Hán-Việt rules: QC 2026-11-03 §2.

## What changed, by stage

1. **Scoped licences.** Unicode-3.0 and CC-BY-SA-3.0 may cover data files only; OFL-1.1 may cover font files only. `scripts/lib/licence-scope.ts` enforces this, the registry records each decision under `policy`, and CLAUDE.md rule 2 is updated. A scoped licence can never clear a voice's lineage. LGPL and Arphic stay off the allowlist; tests cover both.
2. **Hán-Việt.**
   - **Source:** Unihan 17.0.0 (`kVietnamese` and variant fields), pinned by SHA-256. Only the derived data is committed: `content/hanviet/unihan-readings.json`, 2,963 characters.
   - **Pairs:** 118 authored (ja 45, zh 36, ko 37). Each pair is checked syllable by syllable against Unihan, after folding variants: one hop, plus the Jinmeiyō links for shinjitai. 87 are confirmed; 31 carry a note naming the character Unihan cannot confirm.
   - **Reading checks:** ja kana must come from on'yomi only, so kun words get no reading. ko hangul must match the hanja's reading, with the word-initial rule.
   - **Runtime:** `hanVietFor(lang, word)` serves the readings. The D-10 sheet is `content/hanviet/REVIEW.md`.
3. **Runtime plugins ja, zh and ko.**
   - **Tokenizer:** a deterministic longest-match over the course lexicon, attached with `withLexicon`. Without a lexicon it falls back to Intl.Segmenter, or else to single characters.
   - **ja:** kana width, katakana↔hiragana, ー and small-kana folds. Kana typed for kanji counts when the stored reading matches; は is never folded to わ.
   - **zh:** traditional input is folded word by word from the lexicon. Pinyin with marks, numbers or no tones is accepted as a lenient match; 两 and 二 are kept apart.
   - **ko:** jamo are composed into blocks and spacing is ignored. Search folds to keystroke jamo. Numbers use sino or native forms depending on the counter.
   - **Speech grader:** a reading layer counts ja kana and kanji transcripts as equal.
   - **Tests:** ja 64, zh 55, ko 54.
4. **Build-time readings.** Japanese kana and furigana come from JmdictFurigana (CC BY-SA 4.0, same licence as JMdict) and Chinese pinyin from CC-CEDICT (CC BY-SA 4.0). Korean RR comes from our own rules, with 89 tests, 44 of them from examples in the official rule text. MeCab, UniDic and IPADIC were not used: their licences are not on the allowlist.
   - **Schema:** `Word.reading {kana, furigana[], pinyin, rr}`; `pronunciation.notation` adds `kana | pinyin | rr`.
   - **Coverage of the candidate pools:**

     | Language | Confirmed | Listed with a reason |
     |---|---|---|
     | ja | 3,117 / 3,137 | 20 |
     | zh | 3,065 / 3,203 | 138 |
     | ko | 3,212 / 3,230 | 18 |

   - **Test variant:** the test-only course `xc-en` runs the new validators.
5. **Display, primers, paradigms and search.**
   - **Display:** `RubyText` shows furigana above kanji, pinyin under hanzi and RR under hangul. In Vietnamese-native courses, a single Sino word also shows its Hán-Việt reading as a second line. The existing per-course `readingAid` switch toggles it, so the persisted shape is unchanged and no migration is needed. Latin courses render exactly as before; snapshots confirm it.
   - **Evidence guard:** an answer that matched only through kana or pinyin shows as correct but records no first-attempt result and no scheduler evidence. The profile flag `readingInputIsProduction` lets a course opt out.
   - **Script primers:** a new `scriptPrimer` content type with a validator. ja has the vowels and the K row in both kana; zh has the tones, 4 minimal pairs and the strokes; ko has 14 consonants, 10 vowels and block examples. Text is in vi and en, and the D-10 sheets are `content/<lang>/primer/REVIEW.md`. A `/primer` route opens from Section 1 of ja, zh and ko courses. Audio is pending, so the device voice is used.
   - **Paradigms:** ja has 9 cells and ko 5. zh declares concepts instead: measure words and 了, 过, 着, 在.
   - **Search:** CJK lexicon DBs use FTS5 trigram plus a reading column (hiragana, toneless pinyin, jamo + RR). Device and web share one ranker, and they agree on all 19 test queries. expo-sqlite 57.0.2 bundles SQLite 3.50.3 with FTS5; a test pins this.

## Gates (local, last stage)
- `content:validate` ✔. `content:compile` and `content:check` ✔.
- `golden --check` ✔. Re-blessed three times: "P4b Unihan attribution", "P4b CJK readings", "P4b renderers and primers". No fr or en output file was among the differences.
- `typecheck` ✔, `lint` ✔.
- `bun run test`: 2,557 pass, 6 skip, 0 fail. `bunx jest`: 14/14 suites, 104/104 tests, 9/9 snapshots.
- CI and the device shards run on the PR.

## Open
- **Writing rubric, closed (b3108384):** the reading-only check now lives in one helper, `src/lib/languages/reading-input.ts`, shared by typed answers and the writing rubric. A simple-form slot matched only through kana or pinyin is still accepted, but it earns no production credit, and the task records no first-attempt result. `readingInputIsProduction` opts out. There are 17 tests; 9 of them failed on the old engine.
- **Still open, conservative:** in guided writing, ja and zh free writing is not aligned through readings. An answer typed entirely in kana or pinyin therefore fails its rubric and is recorded as wrong, not as practice. Counting it as "understood, practice only" needs a change to free-writing alignment; decide this in P4c.
- **Paradigm tables:** ja and ko tables cannot validate yet, because the kaikki morphology data tags only the dictionary form (and the ja polite non-past). The derivation step must tag the other cells first.
- **Pitch accent:** not derived; it needs a re-scan of the kaikki dump.
- **Reading speeds:** the ja and zh bands are IReST figures cited from memory and flagged in code for a re-check; the ko band is an estimate.
- **Text wrapping:** long plain runs inside a ruby sentence do not wrap mid-run.
- **Unchecked on a phone:** fonts (the system Noto CJK is assumed; no font is bundled), the ruby layout and speech recognition.

## Owner (all optional, `plan/OWNER-FINAL-CHECKLIST.md`)
- In the D-10 pass, read `content/hanviet/REVIEW.md` first (the 31 noted pairs) and the three primer REVIEW sheets.
- Collect about 20 recogniser transcripts per language from a phone: text only, no audio (checklist §C).
