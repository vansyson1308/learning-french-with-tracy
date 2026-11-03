# P4c — Japanese audio without a MeCab dictionary (Kokoro front-end, option B)

Branch `phase-4/ja-vi`, 2026-11-03. Trigger: audio run 41633821152 (ja) failed in *Synthesize*:
`no such file …/unidic/dicdir/mecabrc`. MeloTTS's install step (`python -m unidic download`) had been
hiding the dependency; MeloTTS is excluded since D-11.

## 1. What misaki 0.9.4 does for Japanese (read from the PyPI sdists, not from memory)

Sources read: `kokoro-0.9.4.tar.gz` (`kokoro/pipeline.py`, `kokoro/model.py`) and `misaki-0.9.4.tar.gz`
(`misaki/ja.py`, `misaki/cutlet.py`, `misaki/num2kana.py`, `pyproject.toml`).

- `KPipeline(lang_code="j")` runs `from misaki import ja; ja.JAG2P()`. `misaki/ja.py` imports
  `pyopenjtalk` at module level, and `JAG2P()` defaults to `version="cutlet"`, which builds
  `misaki.cutlet.Cutlet()` → `fugashi.Tagger()` → MeCab with the `unidic` package's dictionary. That is
  the failing call. `misaki[ja]` = `fugashi, jaconv, mojimoji, unidic, pyopenjtalk`.
- **Where MeCab is used (cutlet path, the one Kokoro calls):** (1) word segmentation (UniDic short
  units; each word becomes one space-separated token); (2) kanji → kana: each word's `feature.pron`
  (pronunciation, katakana) — so は (particle) comes back ワ, へ エ, を オ, and long vowels come back
  as ー (先生 センセー, 東京 トーキョー); (3) character type (kana / symbol / unknown). Digits are
  converted before MeCab by `num2kana.Convert` (no counter sound changes; the counter's reading
  comes from MeCab).
- **Pitch accent: not used.** The pitch-aware path (`version="pyopenjtalk"`, the M2P table + a
  `_^-` pitch string) is not what `KPipeline` builds; the cutlet path returns plain phonemes and no
  prosody marks. Kokoro predicts duration, F0 and energy itself (`model.py`: `predictor`,
  `F0Ntrain`) from the phoneme string and the voice's style vector. Nothing about pitch accent is
  lost by bypassing MeCab.
- **Phoneme alphabet the ja voices expect:** cutlet's IPA-like table (`HEPBURN`, 164 kana + 25
  symbols): `ɯ ɨ ʲ ɡ ɾ β ɸ ɕ ʥ ʨ ʦ ʣ ᵝ ç ɲ ŋ ɴ ʔ ː` plus `. , ? ! “ ” « » —`. Rules in
  `_get_single_mapping`: digraphs (きゃ kʲa), small kana, ー → ː, っ → ʔ, ん → m before m/p/b, ŋ before
  k/ɡ, ɲ before ɲ/ʨ/ʥ, n before n/t/d/ɾ/z, ɴ elsewhere; odoriji. `Cutlet.__call__` then joins tokens
  with spaces, glues closing punctuation, maps ( ) to « », and removes spaces around ʔ.
- `KModel.forward(phonemes, ref_s, speed)` maps each character through `config.json` `vocab` and
  **silently drops unknown symbols**; `KPipeline.infer` / `generate_from_tokens(str)` accept a raw
  phoneme string (≤ 510). So the model can be driven without any G2P.

## 2. Bypass design (implemented)

```
clip text ──(plan, TS)──► spoken kana ──► Kokoro phonemes ──(plan JSON)──► kokoro_synth.py --input phonemes ──► KModel
            stored readings          misaki/cutlet table              no KPipeline("j"), no misaki.ja import
```

- `scripts/lib/tts/ja-kana.ts` — reads the text through the same index the app's furigana and romaji
  line use (`romajiTokens` of `src/lib/learning/script-reading.ts`, now exported; every lexeme of
  `content/ja/lexicon/lexemes.json` with its kana + furigana, plus the inflection keys of
  `ja-inflection.ts`, so 食べました / 行って resolve). On top: particles は→わ, へ→え, を→お, also when the
  tokenizer would have read a longer kana word (名前|は|なん, not はな); set phrases (こんにちは → wa);
  numbers + counters (`ja-numbers.ts`: 3000円 さんぜんえん, 四時 よじ, 一匹 いっぴき, 二十歳 はたち,
  phone numbers digit by digit; stored counter words such as 三つ keep their reading); the UniDic
  long-vowel spelling (`pronunciationKana`: せんせい → せんせー, とうきょう → とーきょー, but a verb's
  dictionary-form final う stays: 思う omoɯ). **A kanji without a stored reading is a plan error,
  never a guess**; digits Kokoro cannot read (8:30, 3.5) and Latin letters are errors too.
- `content/audio/ja-spoken-readings.json` — six audio-only readings of words the lexicon lacks
  (私, 箸, 子, 可愛い, 農場, 泊まる), validated (kana only, fits the surface); a lexicon reading always wins.
  These should move into the lexicon in a later content task.
- `scripts/lib/tts/ja-phonemes.ts` — the cutlet table (generated from the 0.9.4 source text, not
  retyped), `_get_single_mapping`, token spacing and clean-up, with both licence notices.
- Per-language switch: `engines.json` `kokoro.phonemeFrontends: { "ja": { "id": "course-readings", … } }` (see §3, re-render gate).
  `audio.ts plan` attaches `phonemes` to every Kokoro segment of a front-end language
  (`attachKokoroPhonemes`); `kokoro.ts` writes `{phonemes,text,out}` jobs and `--input phonemes` for
  those voices only, and refuses a ja segment without phonemes (no silent fallback). Every other
  language's synth line is byte-identical. The helper calls `KModel` directly, splits > 510 at
  sentence ends, and **fails on any symbol outside the model vocabulary** (the model would drop it).
- `misaki[ja]` removed from the install line (`misaki[zh]` kept).

Coverage on the committed content (every clip text of ja-en + ja-vi packs, the lexicon layer, all
listening segments, all story sentences, the canary): **2,599 / 2,599 resolve** (182 failed before
the number pass and the 6 supplement readings). Longest phoneme string: 114.

## 3. Quality we may lose

1. **Readings by longest match, not by MeCab context.** Correct where the lexicon stores the word
   (most compounds and counters are stored); a homograph is read by its first stored reading
   (e.g. 何 なに/なん is whatever the matched surface says). Kana-only words that start with は right
   after a noun without particle would be split as a particle — course text writes those verbs in kanji.
2. **Long vowels at morpheme boundaries.** 場合 ばあい would come out baːi (UniDic: バアイ); rare at A1.
3. **Word spacing differs a little** from UniDic short units (we keep 読みます as one token, MeCab
   splits 読み ます). Spaces are token boundaries for Kokoro, not pauses; effect expected small.
4. **Counter table is finite** (時 時間 分 円 歳 回 階 個 冊 杯 本 匹 番 枚 年 月 人 ページ つ). Others
   read as number + stored reading; 日 dates come from stored words (二十四日 is in the lexicon).
5. Nothing is lost on pitch accent (cutlet never emits it). ASR (SenseVoice) in CI is the check.

**Re-render gate (follow-up).** Keys hash the text, not the phonemes, so engines.json declares
`kokoro.phonemeFrontends.ja = { id: "course-readings", version: 1, inputsSha256 }` and the tag
`phonemes=course-readings-v1` enters the key of every ja Kokoro clip (pack, lexicon, canary, listening, story;
`scripts/lib/audio-recipe.ts`, shared by plan and validator). `inputsSha256` hashes the reading fields of
`content/ja/lexicon/lexemes.json` (what the index reads; glosses excluded), `content/audio/ja-spoken-readings.json`
and the LF source of ja-kana.ts, ja-phonemes.ts, ja-numbers.ts, ja-inflection.ts, script-reading.ts
(`scripts/lib/tts/ja-frontend-inputs.ts`). A test and `audio.ts plan` fail when it is stale: bump the version,
record the new hash, and the next generate re-renders ja. Other languages have no front-end: keys unchanged.
The ja reception layer has its voice manifest (`content/ja/reception/audio-source-manifest.json`, generator
`ja-reception-audio.py`), so the plan covers the 268 listening clips and the 18 band-1 stories.

## 4. Licence chain

| Link | Licence | Status |
|---|---|---|
| cutlet (polm) → kana table/rules | MIT | allowlisted |
| misaki 0.9.4 `cutlet.py` (hexgrad), adapted | Apache-2.0 | allowlisted; registry `misaki-ja-kana-table` |
| kokoro 0.9.4 + Kokoro-82M weights / ja voices | Apache-2.0 | already registered |
| readings: JmdictFurigana / JMdict | CC BY-SA 4.0 | already registered |
| `content/audio/ja-spoken-readings.json` | original | covered by `original-lexicon-etl` |
| fugashi / MeCab / UniDic / NAIST-jdic / pyopenjtalk | BSD (+GPL/LGPL) | **not installed, not imported** |

## 5. Local check

Scratch venv (Windows, CPU): `kokoro==0.9.4`, `misaki==0.9.4` (no extras), torch 2.14.1+cpu;
`fugashi`, `unidic`, `pyopenjtalk` absent. Model + `jf_alpha` from Kokoro-82M at the pinned revision
`f3ff357…` (kokoro-v1_0.pth sha256 `496dba11…`). The repo helper
`scripts/lib/tts/kokoro_synth.py --lang-code j --input phonemes` rendered 5 sentences from
plan-built phonemes (every symbol in the model's 114-symbol vocab):

| Sentence | Phonemes | WAV |
|---|---|---|
| 私は学校へ行って、本を読みます。 | `βataɕi βa ɡaʔkoː e iʔte, hoɴ o jomʲimasɨ.` | 3.42 s |
| おばさんとおばあさんは東京で会いました。 | `obasaɴ to obaːsaɴ βa toːkʲoː de aimaɕita.` | 3.62 s |
| りんごを三つ、鉛筆を二本、猫が一匹います。 | `ɾʲiŋɡo o mʲiʔʦɨ, empʲiʦɨ o ɲihoɴ, neko ɡa iʔpʲikʲi imasɨ.` | 4.47 s |
| このシャツは3000円です。 | `kono ɕaʦɨ βa saɴʣeɴeɴ desɨ.` | 2.58 s |
| 駅はどこですか。電車は何時に出ますか。 | `ekʲi βa doko desɨ ka. deɴɕa βa naɲʥi ɲi demasɨ ka.` | 4.08 s |

24 kHz, peaks 0.35–0.45, plausible speech durations. The misaki path cannot run here at all
(`KPipeline("j")` → `ModuleNotFoundError: pyopenjtalk`), so no side-by-side; intelligibility is for
the CI SenseVoice audit. Nothing was listened to or ASR-checked locally.

## 6. Recommendation

**Option B.** It removes every BSD component, fails closed on anything it cannot read, and reuses
readings the course already validates and shows learners (the audio now says what the furigana
says). Next steps: run `audio.yml` canary for ja (both voices) and compare the SenseVoice WER with
the earlier misaki-path canary (jf_alpha 0.2255, jm_kumo 0.5026); move the six supplement readings
into the lexicon. Ask for a BSD data scope only if the canary WER is clearly worse than before.
