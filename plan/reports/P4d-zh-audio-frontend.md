# P4d — Mandarin audio from stored pinyin (Kokoro front-end, tone sandhi for audio)

Branch `phase-4/zh-vi`, 2026-11-05. Decision: QC-2026-11-05 §1.5, zh-plan decision 10 and §7. Finishes the paused
`wip/zh-audio-frontend` commit (7445e915, untested), mirroring the ja front-end (`P4c-ja-audio-frontend.md`).

## 1. What Kokoro's own Chinese G2P would do (misaki 0.9.4 sdist, sha256 3960fa3e…, read 2026-11-05)

`KPipeline(lang_code="z")` builds `misaki.zh.ZHG2P(version=None)`: `cn2an` digits → hanzi, `jieba` words,
`pypinyin.lazy_pinyin(TONE3)` per word (its own dictionaries; no tone sandhi, 了/得/还 guessed), then
`transcription.pinyin_to_ipa(py)[0]` + `retone` (Chao letters → `→ ↗ ↓ ↘`, ɻ̩/ɹ̩ → ɨ), syllables of a word joined,
words spaced, U+032F dropped. Nothing about the model needs the dictionaries: `KModel` takes a phoneme string.

## 2. Design (implemented)

```
clip text ─(plan, TS)─► stored words + pinyin ─► sandhi for audio ─► Kokoro phonemes ─► kokoro_synth.py --input phonemes
          lexicon (CC-CEDICT)   app's index walk    zh-sandhi.ts        misaki table        no KPipeline("z"), no jieba/pypinyin
```

- `scripts/lib/tts/zh-readings.ts`: the clip is cut by the app's longest-match walk over `content/zh/lexicon/lexemes.json`
  (`buildScriptReadingIndex`, as the pinyin line); one stored reading per word, citation tones. Digits are spelt first
  (`zh-numbers.ts`: 2 → 两 before a measure word via `chineseTwoBeforeMeasure`, 100 一百, 2026年 二零二六年). **A hanzi no stored
  word reads, a Latin letter, a decimal, a time, a leading zero is a plan error naming the clip, never a guess.**
- Sandhi, audio only, per phrase between marks (`phraseSandhiTones`; the primer's `sandhiTones` is unchanged):
  不 bú before a 4th tone (不是 不对 不去 不要; bù before 1/2/3); 一 yí before a 4th (一个 一样), yì before 1/2/3 (一天 一年 一起),
  yī after 第 or a numeral, before a digit or 月/号/日, at a phrase end and at the end of a stored word (第一 十一 一月 统一 星期一);
  3-3 inside out by word structure — a word's own syllables first (a 3+ syllable word splits at its longest stored
  first part, else last part), then across words; runs of one-syllable words in feet of two, the last taking a stray
  third (Chen 2000): 你好 ní hǎo, 我很好 wó hén hǎo, 展览馆 zhán lán guǎn, 小老虎 xiǎo láo hǔ, 我有两本书 wó yǒu liáng běn shū.
  Neutral tones stay (的 了 吗 们 子). 儿化 (CC-CEDICT `r5`) is set aside for the sandhi and written onto the syllable before it,
  replacing a final -n (一点儿 …tjɛ↓ɚ).
- `scripts/lib/tts/zh-phonemes.ts`: the dictionary-free part of misaki's `transcription.py` (first variants) + `retone`,
  pypinyin's strict initial/final split rewritten. Every symbol emitted is in the pinned `config.json` vocab
  (revision f3ff357…, sha256 5abb01e2…; checked by test).
- Re-render gate: `engines.json kokoro.phonemeFrontends.zh = { course-readings, version 1, inputsSha256 }`; the tag enters
  every zh Kokoro key. Inputs (`zh-frontend-inputs.ts`): lexicon surface + pinyin + parsed syllables, the 2 → 两 rule's output
  on probes, the sources of zh-readings/zh-phonemes/zh-numbers/zh-sandhi and script-reading.ts. zh.ts's graders are not
  inputs (a grader fix must not re-render zh).
- `misaki==0.9.4` is installed without `[zh]`; zh pack/lexicon/reception are Opus 16 kbps. zh-vi is `generated` with the
  plan cast A `kokoro-zf_xiaobei`, B `kokoro-zm_yunjian` (pending the canary + `select`). zh-en stays `device-tts`: its pack
  says 早餐, which the lexicon lacks (`select` would flip it — add the word first).

## 3. Coverage and dry runs (after `author.ts promote --target zh --native vi --allow-missing-audio`)

- Listening segments and story sentences: 1,278 / 1,278 resolve (376 + 902), every lexicon surface too; no symbol
  outside the vocab; longest phoneme string in the plan 133.
- `audio.ts plan --lang zh --layer all --mode generate`: 2,326 clips / 1,969 assets — pack 874, lexicon 725,
  listening 312 (308 assets), stories 415 (414); every segment carries phonemes.
- ja 2,421 / 2,036 and es 1,782 / 1,629: plan files byte-identical to the base commit.
- Canary (`content/zh/reception/audio-canary.json`, canary mode only): 6 of 12 items fail closed — 骂, 伞, 石狮, 玩 (only 玩儿 is
  stored), 色, 预订 are not in the lexicon. Re-author the canary (§7: tone pairs, sandhi, neutral tones) or add the words.

## 4. Quality we may lose

1. Longest-match readings, one per surface (a homograph reads its stored reading). 2. Underlying third tones stored
neutral do not trigger 3-3 (小姐 xiǎo jie, not xiáo jie). 3. Feet are a fixed rule; tempo-dependent variants (mái vs mǎi
in long runs) are not modelled. 4. 儿化 drops -n only (一会儿 keeps its -i). ASR (SenseVoice CER) in CI is the check.

## 5. Licence chain

| Link | Licence | Status |
|---|---|---|
| pinyin-to-ipa (Stefan Taubert) → table | MIT | allowlisted |
| misaki 0.9.4 transcription.py + zh.py (hexgrad), adapted | Apache-2.0 | registry `misaki-zh-pinyin-ipa` |
| readings: CC-CEDICT | CC BY-SA 4.0 | already registered |
| sandhi rule (scripts/lib/zh-sandhi.ts) | original | — |
| jieba / pypinyin / pypinyin-dict / cn2an | MIT (+ zdic data, licence unstated) | **not installed, not imported** |
