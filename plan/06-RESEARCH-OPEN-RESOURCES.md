# Open resources for scaling the course from French to de / es / it / pt / ja / ko / zh / en (+ Vietnamese as UI/native language)

Research date: 2026-10-14. Scope: licences that allow redistribution inside an offline Expo/React-Native app (MIT code, CC BY-SA data, ATTRIBUTIONS.md), build-time TTS synthesis, on-device ASR, on-device/BYO-key LLM, graded text and image sets. Every factual claim carries an inline citation `[n]`; the numbered list is at the end. Where a page could not be reached or a licence is not stated, that is said explicitly rather than guessed.

Conventions used below: "bundle-safe" = may be shipped inside the APK with attribution; "build-time only" = tool/model may be used to generate assets but should not itself be shipped (GPL, NC, etc.); "avoid" = no licence found that permits redistribution.

---

## 0. Executive summary

* **Lexicon backbone for all eight target languages: kaikki.org / wiktextract (Wiktionary → JSONL, CC BY-SA + GFDL).** It gives lemma, POS, gender (as sense tags), full inflection tables in `forms[]` with tags, IPA, and glossed example sentences with English translations. Verified on live entries for Spanish *hablar* (212 forms, IPA, examples) and German *Haus* (`neuter`/`strong` tags, genitive/plural forms) [4][5][6][7][8]. Non-English editions (de, es, fr, it, ja, ko, pt, zh, vi…) exist as raw extracts but are "work in progress" [5].
* **Frequency: hermitdave/FrequencyWords (OpenSubtitles 2016/2018 lists, CC BY-SA 4.0 content, MIT code)** is the cleanest bundle-safe frequency source for every language including vi [1]. `wordfreq` (Apache code, CC BY-SA 4.0 data, snapshot ≈2021, "unlikely to be updated again") is a good second source and covers de/es/it/pt/ja/ko/zh/vi/en [2]. SUBTLEX-PT is CC BY [18]; SUBTLEX-DE/ESP licences are not stated on the pages reached — treat as research-only.
* **CEFR banding:** no single open A1 list per language. Usable open-ish anchors: CEFR-J + Octanove profile for English (free incl. commercial with citation / CC BY-SA 4.0) [15], NGSL (CC BY-SA 4.0) [16], NIKL 5,965-word graded Korean learner list (KOGL Type 1, attribution) [13], HSK 3.0 cleaned list (government document; redistributed under MIT by community repos, copyright status noted as unclear) [12], Jonathan Waller JLPT lists (CC BY) via openjlpt (CC BY-SA 4.0) [20]. Goethe A1 Wortliste carries no licence notice (≈650 entries; "als Information und Referenz … gedacht") — use as a reference to *select* which Wiktionary/FrequencyWords lemmas go into A1, not as redistributed data [10]. Oxford 3000/5000: no licence on the OUP page → avoid [14]. CEFRLex (DAFlex de, ELELex es, EFLLex en…) states no licence on its index page → verify before use [17].
* **TTS, build-time:** Piper voices with CC0 / CC BY datasets for de (thorsten CC0, kerstin CC0, mls CC BY 4.0), es (davefx CC0, carlfm PD, sharvard CC BY 3.0, claude Apache-2.0, daniela CC BY-SA 4.0), pt (faber/cadu/jeff/tugão CC0, edresson CC BY 4.0), vi (vais1000 CC BY 4.0) [26][27]. Italian Piper voices say "License: See URL" (paola, riccardo) and zh huayan says "Unknown" → prefer Kokoro-82M (Apache-2.0; it/zh/ja/es/pt-BR/en, no ko, no vi) [29][30] and MeloTTS (MIT; en/es/fr/zh/ja/ko) [31] for it/zh/ja/ko. Korean has no Apache/MIT Piper/Kokoro voice: use MeloTTS-KR (MIT) at build time; sherpa-onnx's only Korean VITS is `vits-mimic3-ko_KO-kss_low` [34] (KSS dataset — check its NC terms). Supertonic 3 (99M, ONNX, 31 languages incl. ko/ja/vi/de/es/it/pt, OpenRAIL-M) is a new on-device candidate but has use-based restrictions and no zh [36].
* **TTS, run-time on device:** Google "Speech Recognition & Synthesis" lists ja, ko, zh-CN/TW, vi, de, es, it, pt-BR/PT voices but "users must install voice data for each language" — i.e. not guaranteed offline on a fresh device [38]. Keep the French approach (synthesise at build time, bundle compressed audio); add on-device TTS via `react-native-sherpa-onnx` (MIT, RN ≥0.70, TurboModule, bundles sherpa-onnx 1.12.35) only if a feature truly needs open-ended speech [37].
* **ASR:** Android on-device recognition via `expo-speech-recognition` is Android 13+/iOS 17+ and needs a per-locale offline model download; `installedLocales` only populates with the Google `com.google.android.as` service [39]. For deterministic coverage ship open models: whisper.cpp small-q5_1 is 181 MiB multilingual [40] via `whisper.rn` (MIT, Hexagon NPU path on SD 8 Gen 1+) [41]; Vosk small models are 31–82 MB Apache-2.0 for de/es/it/pt/ja/ko/zh/vi/en [46]; sherpa-onnx has streaming Zipformer for zh (67 MB int8), ko (121 MB int8), en (68 MB int8) [42] and offline Zipformer for ja (148 MB int8) and vi (26 MB int8) [43]; SenseVoice int8 (226 MB) covers zh/yue/en/ja/ko [44]; Moonshine has ja/ko/zh/vi/es/en (26–58M params; no de/it/pt) [45].
* **On-device LLM:** feasible but not bundle-able (0.6–1.7 GB). On mid-range Android a Q4 1B model runs 12–18 tok/s on Snapdragon 6 Gen 3, 18–25 on 7 Gen 3, needing ≈800 MB RAM; 3B needs ≈2.2 GB and <10 tok/s on budget chips [50]. ML Kit GenAI Prompt API (Beta) gives free Gemini Nano on a device-tier list (Pixel 9–11, select Samsung/OnePlus/Xiaomi/OPPO/vivo) but language support "may vary" and is not documented [48]. Recommendation: BYO API key for grammar feedback (Gemini 3.1 Flash-Lite $0.25/$1.50 per 1M tokens with a free tier [53]; gpt-5-nano $0.05/$0.40 [55]; DeepSeek Flash $0.15–0.30 in / $0.60–1.20 out [54]) plus an optional downloadable Qwen3-1.7B/0.6B GGUF (Apache-2.0) via llama.rn for offline users [52].
* **Vietnamese:** FVDP/OVDP dictionaries are GPLv2 → do not merge into the CC BY-SA DB [24]; use kaikki's `vi` edition and the English edition's `translations[]` into Vietnamese (CC BY-SA) [5][6]. Vietnamese TTS: Piper `vi_VN-vais1000-medium` (CC BY 4.0 dataset) [27]. Vietnamese frequency: FrequencyWords vi [1], wordfreq vi (3 sources, no large list) [2].

---

## 1. Frequency lexicons, word lists, dictionaries and morphology — per language

### 1.1 Cross-language sources (apply to all targets)

| Source | What you get | Licence | Verdict |
|---|---|---|---|
| hermitdave/FrequencyWords | Per-language `*_50k.txt` / full lists from OpenSubtitles2016 and OpenSubtitles2018 (word, count) | "MIT License for code, CC-by-sa-4.0 for content" [1] | Bundle-safe with attribution; share-alike matches your CC BY-SA data policy. Note the README does not state the licence of the upstream OPUS subtitle data [1]; what you ship is only the derived counts. |
| wordfreq (R. Speer) | Zipf-scaled word frequencies; de/es/it/pt/ja/zh/en have "large" lists, ko and vi only the standard list; zh covers Simplified and Traditional; ja/ko tokenisation needs `wordfreq[cjk]` | Code Apache-2.0; data CC BY-SA 4.0; Google Books Ngram and SUBTLEX components carry extra acknowledgement duties [2] | Bundle-safe as a *derived rank column* with the Zenodo citation. The author states the snapshot is "through about 2021" and "unlikely to be updated again" and discourages CSV dumps that strip attribution [2] — so export ranks into your own DB with the citation in ATTRIBUTIONS.md. |
| Leipzig Corpora Collection | Sentence corpora + word frequency lists for 100–200 languages | Catalogue entry quotes two terms: general Wortschatz data "CC BY-NC"; "All corpora provided for download are licensed under CC BY" [3]. The wortschatz.uni-leipzig.de pages themselves were behind an Anubis bot-check and could not be read. | Downloaded corpora: bundle-safe (CC BY). Re-check the terms page manually before relying on it. |
| kaikki.org / wiktextract | JSONL per language: `word`, `pos`, `lang_code`, `senses[].glosses/tags/examples`, `forms[].form/tags`, `sounds[].ipa`, `translations[]`, `head_templates` | Site: "same licenses as Wiktionary – both CC-BY-SA and GFDL"; cite Ylonen (LREC 2022) and link kaikki.org [4]. Code MIT [6]. | **Primary lexicon source.** Verified fields on live data: *hablar* has 212 `forms` tagged e.g. `('hablo', ['first-person','present','singular'])`, IPA `/aˈblaɾ/`, examples with `translation` [7]; *Haus* senses carry `['neuter','strong']`, forms `('Hauses',['genitive'])`, `('Häuser',['plural'])`, IPA `[haʊ̯s]` [8]. Raw extracts exist for editions en, zh, cs, nl, fr, de, el, id, it, ja, ko, ku, ms, pl, pt, ru, simple, es, th, tr, vi (non-English "work in progress") [5]. |
| Tatoeba | Sentences + translation links + per-language exports + "sentences with audio" index | Sentences CC BY 2.0 FR; a CC0 subset; Tanaka Corpus (ja/en) public domain; **audio licence is chosen per contributor** and empty-licence audio "can't be reused outside Tatoeba" [9] | Bundle-safe for text with attribution; filter audio rows by licence column. |
| Universal Dependencies | Treebanks for POS/lemma per language | Per-treebank CC BY-SA / CC BY-NC-SA (not re-verified here) | Use only at build time (for POS tagging / lemmatisation); you do not need to ship treebank data. |
| UniMorph | Inflection tables | Commonly CC BY-SA 3.0 per language (not re-verified here) | Redundant once kaikki `forms[]` is used; keep as fallback. |

### 1.2 German (de)

* **Frequency:** FrequencyWords `de` [1]; wordfreq `de` (7 sources, large list) [2]; Leipzig `deu` corpora (CC BY download) [3]. SUBTLEX-DE: no licence statement found on the pages reached → research-only.
* **Lemma / POS / gender / plural / conjugation:** kaikki German edition or the English edition's German entries. Gender arrives as sense tags (`neuter`, `strong`), case/number forms in `forms[]` [8]. Verb conjugation tables are in `forms[]` the same way as Spanish [7]. Note that lowercase lookups return verb forms (e.g. `haus` → "singular imperative of hausen") [8]; key the DB on the case-sensitive headword.
* **CEFR:** Goethe-Zertifikat A1 / Start Deutsch 1 Wortliste ≈650 entries; the PDF has no copyright or licence notice, only "Die Wortliste ist als Information und Referenz für alle Interessenten gedacht" [10]. Use it as a selection reference and regenerate your own list from CC BY-SA sources; do not copy the PDF's glosses/examples. CEFRLex DAFlex (German, receptive, A1–C2) — licence not stated on index page [17]. Profile Deutsch is a commercial product (not researched further; assume non-redistributable).
* **Article/gender data:** from kaikki `head_templates.args` (`de-noun`, `'n,,^er'`) or sense tags [8].

### 1.3 Spanish (es)

* **Frequency:** FrequencyWords `es` [1]; wordfreq `es` (large) [2]; Leipzig `spa` [3]. SUBTLEX-ESP: licence not confirmed → research-only.
* **Lexicon/conjugation:** kaikki Spanish (English edition) — *hablar* has the full `es-conj` table in `forms[]` and `head_templates` giving principal parts [7]. Gender for nouns arrives as sense tags (same mechanism as German) [6][8].
* **CEFR:** Instituto Cervantes PCIC inventories are published online but no open licence was found in this research → reference only. CEFRLex ELELex (es) — licence not stated [17]. Kelly project has no Spanish list [11].

### 1.4 Italian (it)

* **Frequency:** FrequencyWords `it` [1]; wordfreq `it` (large) [2]; Leipzig `ita` [3].
* **Lexicon/conjugation/gender:** kaikki Italian (English edition; Italian edition also exists as raw extract) [5].
* **CEFR:** Kelly Italian list exists (A1–C2) but only the Swedish list has a stated licence (CC BY-SA 3.0 + LGPL 3.0); other languages' licences are not stated on the page [11] → ask Språkbanken / treat as reference.

### 1.5 Portuguese (pt — recommend pt-BR primary with pt-PT variants flagged)

* **Frequency:** SUBTLEX-PT is **CC BY** (co-author confirmed "it is CC-by, you can use it freely") with the Soares et al. 2015 citation [18]; FrequencyWords `pt` / `pt_br` [1]; wordfreq `pt` (5 sources, large) [2].
* **Lexicon/conjugation/gender:** kaikki Portuguese; the raw `pt` edition exists too [5].
* **CEFR:** no open graded list found; derive A1 from frequency + Tatoeba coverage.

### 1.6 Japanese (ja)

* **Dictionary:** JMdict and KANJIDIC2 are CC BY-SA 4.0 with specific attribution rules: for smartphone/tablet apps the acknowledgement must be on a separate "About/Sources" screen ("It is not sufficient just to mention it on a start-up/launch page") and documentation/licence files must be included or linked [19]. JMnedict is not named on the licence page (ENAMDICT is) — verify separately [19].
* **Frequency:** wordfreq `ja` (large; needs `wordfreq[cjk]`) [2]; FrequencyWords `ja` [1]. Tokenisation at build time with MeCab/fugashi (not researched here).
* **JLPT levels:** JLPT publishes no official lists; openjlpt bundles 8,334 words N5–N1 + 2,211 kanji as JSON/CSV/SQLite, levels from Jonathan Waller's lists (CC BY), kanji from KANJIDIC2 (CC BY-SA 4.0), examples from Tatoeba, whole dataset CC BY-SA 4.0 [20]. This is the most convenient bundle-safe JLPT anchor.
* **Furigana/readings on device:** kuroshiro (MIT) converts to hiragana/katakana/romaji with furigana/okurigana modes; the Kuromoji analyser works in browsers (dictionary files served from a URL), MeCab analyser is Node-only [25]. In an offline RN app the practical route is **pre-computing** readings at build time (kuromoji/MeCab in the pipeline) and storing `reading`/`furigana` fields per item, rather than shipping the ~20 MB kuromoji dictionary.
* **Conjugation:** kaikki Japanese entries carry `forms[]` from Wiktionary conjugation tables (same mechanism as es/de) [6]; verify coverage per verb class during ETL.

### 1.7 Korean (ko)

* **Official graded vocabulary:** NIKL 한국어 학습용 어휘 목록 (May 2003): 5,965 words in three levels (A 982 / B 2,111 / C 2,872), each with frequency rank, POS, short definition/example; page states Korea Open Government License (KOGL) Type 1 (use with source credit), although the site footer says "ALL RIGHTS RESERVED" [13]. Bundle with KOGL attribution; keep a copy of the page in your records.
* **Dictionaries:** Urimalsaem (NIKL, collaborative, CC BY-SA 2.0 KR unless stated otherwise; commercial use allowed with attribution) [22]. Basic Korean Dictionary / Korean–English Learners' Dictionary (NIKL, launched 2016; one of ten bilingual learner dictionaries) — the Wikipedia page gives no licence or API details [23]; NIKL's Open API exists but terms were not verified here. Kengdic/engdic: packaged by openSUSE as "Little Korean <-> English Dictionary"; licence not verified in this research. kaikki `ko` edition raw extract exists [5].
* **Frequency:** wordfreq `ko` (4 sources, standard list only) [2]; FrequencyWords `ko` [1].
* **Romanisation / conjugation JS libs:** several npm packages exist (aromanize, kroman, hangul-romanization, @romanize/korean) — licences not verified; prefer precomputing Revised Romanisation at build time.
* **TOPIK:** no official public vocabulary list beyond the NIKL list above; topikguide "6000 words" compilations are unofficial and unlicensed → avoid.

### 1.8 Mandarin Chinese (zh)

* **Dictionary:** CC-CEDICT, 123,524 entries (16 Jul 2025), CC BY-SA **3.0**, format `Trad Simp [pin1 yin1] /gloss/`, download from MDBG [21]. Unihan (Unicode licence) for character data — not re-verified here.
* **HSK 3.0:** ivankra/hsk30 gives 11,092 terms with simplified/traditional, pinyin with diacritics, POS codes, level 1–6 + "7-9", CC-CEDICT cross-references; code MIT; data derived from two MIT repos that transcribed a PRC Ministry of Education scanned PDF, and the README flags that the Ministry's site asserts copyright while the data may be public domain under PRC law [12]. Treat the level labels as facts (not copyrightable expression) and regenerate your own entries from CC-CEDICT/kaikki; cite ivankra/hsk30 in ATTRIBUTIONS.md.
* **Frequency:** wordfreq `zh` (7 sources + Jieba wordlist; Simplified and Traditional) [2]; FrequencyWords `zh_cn` [1].
* **Pinyin on device:** pinyin-pro is a common JS option (npm page could not be fetched; licence unverified). Since every item ships with CC-CEDICT pinyin, precompute pinyin (tone-marked) at build time and avoid a runtime library.
* **Kelly Chinese list** exists but licence unstated [11].

### 1.9 English (en — for Vietnamese learners)

* **CEFR:** CEFR-J Vocabulary Profile v1.5 ("can be used for research and commercial purposes with no charge, provided that you cite the dataset properly"; © Tono Lab, TUFS) and Octanove C1/C2 profile (CC BY-SA 4.0) [15]. NGSL 1.2: 2,809 words with frequency statistics, CC BY-SA 4.0 (no CEFR levels) [16]. Oxford 3000/5000 page describes CEFR coverage but states no licence → avoid [14]. English Vocabulary Profile (Cambridge) not researched; assume restricted.
* **Frequency:** FrequencyWords `en` [1]; wordfreq `en` [2].
* **Lexicon:** kaikki English edition (largest: 1,787,236 senses) with IPA, forms, examples [4].

### 1.10 Vietnamese (vi) as source/UI language

* **EN↔VI / JA↔VI / KO↔VI / ZH↔VI translations:** use kaikki `translations[]` from the English edition (per sense, with `code: "vi"`) and the raw `vi` Wiktionary edition [5][6]. OVDP/FVDP (tudientiengviet.net; AnhViet.zip) is **GPLv2** [24] — copyleft that conflicts with distributing inside a CC BY-SA database; keep it out, or use it only to QA your own translations. Mazii is proprietary (not researched).
* **Frequency:** FrequencyWords `vi` [1]; wordfreq `vi` (3 sources, no large list) [2]; Leipzig `vie` corpora [3].
* **Sentences:** Tatoeba `vie` export [9]; Common Voice sentence text (CC0) [56].

---

## 2. Open TTS voices for offline/build-time synthesis

### 2.1 Engines and licences

| Engine | Languages (relevant) | Licence | Notes |
|---|---|---|---|
| Piper (classic `rhasspy/piper`, voices on HF) | de, es (ES/MX/AR), it, pt (BR/PT), zh_CN, vi_VN, en; **no ja, no ko** [26] | Engine MIT (classic); **voice licences follow the dataset** per MODEL_CARD [27] | Best quality/size for build-time batch synthesis. The successor **piper1-gpl** is GPL-3.0 and embeds espeak-ng [28] → fine at build time, do not bundle the runtime. |
| Kokoro-82M | en (US/GB), ja (5 voices, grades C+–C-), zh (8 voices, grade D), es (3), fr (1), hi, it (2, grade C), pt-BR (3); **no ko, no vi** [30] | Apache-2.0; trained only on permissive/non-copyrighted audio; "Support for non-English languages may be absent or thin due to weak G2P" [29][30] | Good for it/pt/es/ja; zh voices rated D by the author. |
| MeloTTS | en (5 accents), es, fr, zh (mixed with en), ja, ko [31] | MIT; "fast enough for CPU real-time inference" [31] | Only MIT option covering **ja and ko**. sherpa-onnx ships only the `vits-melo-tts-zh_en` conversion (163 MB) [33]. |
| sherpa-onnx TTS catalogue | zh: Matcha `zh-baker`, Kokoro multi-lang v1.0/v1.1 (zh+en), MeloTTS zh_en, several VITS-zh; en: Piper/Matcha/Kokoro/Kitten; **Korean: `vits-mimic3-ko_KO-kss_low`** [34]; no ja/vi models on the index pages [32][33] | Per model; Baker/KSS datasets are typically non-commercial — verify before shipping | Run-time engine for RN via react-native-sherpa-onnx [37]. |
| MMS-TTS (Meta) | separate VITS checkpoint per language; HF checks: `kor`, `vie`, `deu`, `spa`, `por` exist; `jpn`, `ita`, `cmn` returned 401/absent [34][35] | **CC BY-NC 4.0** [35] | Non-commercial → avoid for a distributed app unless you accept NC. |
| Supertonic 3 | 31 languages incl. ko, ja, vi, de, es, it, pt, en; **no zh**; 99M params, ONNX, CPU, preset voices [36] | **OpenRAIL-M** (model), MIT (sample code) [36] | Use-based restrictions; acceptable for build-time if your use complies; strong ko/ja/vi candidate. |
| XTTS (Coqui) | many | CPML non-commercial (well known; not re-verified) | Avoid. |
| Fish-Speech / F5-TTS / CosyVoice | — | Non-commercial variants exist (CC BY-NC-SA / CC BY-NC); CosyVoice Apache — not re-verified here | Not needed given the above. |
| Google / Edge cloud TTS | — | Not offline; ToS prohibits redistribution of synthesised audio as a dataset in many cases | Out of scope. |

### 2.2 Piper voice licences (from MODEL_CARD files) [27]

| Lang | Voice | Quality | Dataset licence |
|---|---|---|---|
| de_DE | thorsten (low/medium/high), thorsten_emotional | up to high | **CC0** |
| de_DE | kerstin | low | **CC0** |
| de_DE | mls (236 spk) | medium | CC BY 4.0 |
| es_ES | davefx | medium | **CC0** |
| es_ES | carlfm | x_low | Public domain |
| es_ES | sharvard (2 spk) | medium | CC BY 3.0 |
| es_MX | claude | high | Apache-2.0 |
| es_MX | ald | medium | not checked |
| es_AR | daniela | high | CC BY-SA 4.0 |
| it_IT | paola | medium | "See URL" (HF dataset) — unverified |
| it_IT | riccardo | x_low | "See URL" (M-AILABS) — unverified |
| pt_BR | faber, cadu, jeff | medium | **CC0** |
| pt_BR | edresson | low | CC BY 4.0 |
| pt_PT | tugão | medium | **CC0** |
| zh_CN | huayan | x_low/medium | **Unknown** |
| vi_VN | vais1000 | medium | CC BY 4.0 |
| vi_VN | vivos (65 spk) | x_low | CC BY-NC-SA 4.0 |
| vi_VN | 25hours_single | low | Unknown |

### 2.3 Device TTS (expo-speech) coverage

Google's "Speech Recognition & Synthesis" engine lists TTS for Japanese, Korean, Chinese (China/Taiwan) + Cantonese, Vietnamese, German, Spanish (ES/US), Italian, Portuguese (BR/PT); the page notes "Users must install voice data for each language" and does not document offline behaviour [38]. Practical reading: voices are downloadable packs, present on many devices but not guaranteed, and OEM engines (Samsung, Xiaomi) differ. Treat expo-speech as a best-effort fallback for UI/explanations, never as the source of graded listening audio.

### 2.4 Recommended synthesis route per language

| Lang | Build-time voice (primary → fallback) | Run-time on-device? |
|---|---|---|
| de | Piper thorsten-high (CC0) → thorsten-medium; female: kerstin-low (CC0) or mls speaker (CC BY) [27] | Not needed; expo-speech fallback. |
| es | Piper davefx-medium (CC0, es-ES); es-MX claude-high (Apache) if Latin-American target; sharvard for a second voice [27] | Same. |
| it | Kokoro it (Apache, grade C) [30]; Piper paola only after confirming dataset licence [27] | Same. |
| pt | Piper faber/cadu/jeff-medium (CC0, pt-BR), tugão (CC0, pt-PT) [27]; Kokoro pt-BR as alternative [30] | Same. |
| ja | MeloTTS-JP (MIT) [31] or Kokoro ja (Apache, C+) [30]; A/B with the Whisper round-trip audit | sherpa-onnx has no ja TTS on its index [32]; rely on bundled audio. |
| ko | MeloTTS-KR (MIT) [31]; Supertonic 3 ko (OpenRAIL-M) [36] | `vits-mimic3-ko_KO-kss_low` via sherpa-onnx exists [34] but check KSS dataset terms. |
| zh | MeloTTS-ZH (MIT) [31]; Kokoro zh (D-grade) [30]; avoid huayan (licence unknown) [27] | sherpa-onnx `vits-melo-tts-zh_en` 163 MB [33] — too large to bundle. |
| en | Piper en_US lessac/libritts (classic voices; licences not re-checked here) or Kokoro en (Apache, best-graded voices) [30] | Fallback expo-speech. |
| vi (UI) | Piper vais1000-medium (CC BY 4.0) [27]; Supertonic 3 vi [36] | Fallback expo-speech (vi listed) [38]. |

Keep the existing Whisper ASR round-trip gate; for ja/ko/zh use SenseVoice or Whisper-small for the audit because Whisper-tiny/base is weak on CJK (see §3).

APK budget: at your current ≈8 MB per course, eight more courses at Opus/AAC ~24 kbps is still ≈70 MB total; consider per-language on-demand download (Expo asset bundle or your own CDN) if you want to keep the base APK small.

---

## 3. On-device ASR for speaking practice

### 3.1 Platform recognisers (`expo-speech-recognition`)

* On-device recognition is supported on Android 13/14+ (not Android 12 and below) and iOS 17+; pass `requiresOnDeviceRecognition`; `supportsOnDeviceRecognition()` reports capability; each locale needs an offline model via `androidTriggerOfflineModelDownload({locale})` (Android 13 opens a system dialog; 14+ returns `download_success`/`download_scheduled`); `getSupportedLocales().installedLocales` is populated only when the service package is `com.google.android.as` [39]. The README does not list which languages have on-device models and says it "seems to work well" for single-word prompts [39].
* Consequence: it works for your current French flow on Pixel-class devices but is non-deterministic across OEMs and for ja/ko/zh/vi. Keep it as the default path, add an open-model path as fallback.

### 3.2 Open models (sizes, languages, licences)

| Engine / model | Languages | Size | Licence | RN binding |
|---|---|---|---|---|
| whisper.cpp `tiny` / `base` / `small` (multilingual) | all 8 + vi | 75 / 142 / 466 MiB; q5_1: 31 / 57 / 181 MiB; q8_0: 42 / 78 / 252 MiB [40] | MIT (whisper.cpp) | `whisper.rn` (MIT): iOS/Android, Core ML, experimental Hexagon NPU for SD 8 Gen 1+, Silero VAD, realtime transcriber; Expo after prebuild; q5 falls back to CPU on Hexagon [41] |
| Vosk small models | de 45 MB, es 39 MB, it 48 MB, pt 31 MB, ja 48 MB (CER 9.5 CSJ), ko 82 MB (WER 28.1 Zeroth), zh 42 MB, vi 32 MB, en 40 MB — all Apache-2.0 (pt big model GPLv3; de-zamia LGPL) [46] | Apache-2.0 | third-party `react-native-vosk` (not verified here) |
| sherpa-onnx streaming Zipformer | zh int8 67 MB (multi-zh-hans) / 154 MB; ko int8 121 MB; en int8 68 MB; no de/es/fr/ja/vi streaming [42] | Apache-2.0 (sherpa-onnx); model licences per card | `react-native-sherpa-onnx` (MIT; RN ≥0.70; offline + streaming STT, TTS; VAD scheduled 0.7.0) [37] |
| sherpa-onnx offline Zipformer | ja ReazonSpeech int8 148 MB (35k h); vi int8 26 MB (6k h) / 68 MB (70k h); zh-en int8 66 MB [43] | as above | same |
| SenseVoice (sherpa-onnx) | zh, yue, en, ja, ko; int8 226–228 MB; RTF 0.099 on Cortex-A76 1 thread [44] | not stated on page (check LICENSE in archive) | same |
| Moonshine | en (26–245M), ar, ja base 58M (CER 13.6), ko tiny 26M (6.5), zh base 58M (25.8), es base 58M (4.3), uk, vi base 58M (8.8); **no de/it/pt** [45] | not stated on page (verify per model card) | ONNX via sherpa-onnx / own binding |

### 3.3 Recommendation per language

* **de/es/it/pt/en:** platform recogniser first (Android 13+ packs exist for these major locales), fallback Vosk small (31–48 MB, Apache) or whisper small-q5_1 (181 MiB, shared across all languages) [40][46].
* **ja:** platform recogniser (Pixel/Google service) → sherpa-onnx ja ReazonSpeech int8 (148 MB) or Vosk small-ja (48 MB) [43][46]. Whisper-tiny/base is not reliable for ja; small-q5_1 acceptable.
* **ko:** platform → sherpa-onnx streaming Korean int8 (121 MB) [42] or Moonshine ko-tiny (26M params) [45]; Vosk small-ko WER 28 % is marginal [46].
* **zh:** platform → sherpa-onnx streaming multi-zh-hans int8 (67 MB) [42] or Vosk small-cn (42 MB) [46].
* **vi (if ever needed for UI voice input):** sherpa-onnx vi-30M int8 (26 MB) [43].
* Shipping strategy: do **not** bundle ASR models; download on first use of speaking practice for that language (26–181 MB).

### 3.4 Pronunciation scoring

* Cloud scorers (SpeechAce, ELSA) are not offline. Open research direction is Goodness-of-Pronunciation on CTC acoustic models; the 2025 "segmentation-free GOP" paper (GOP-SF/GOP-SA) scores phoneme sequences against all alignments of a CTC model and evaluates on CMU Kids and speechocean762 (English) [47]. No turnkey on-device library exists; a pragmatic path is (a) keep word-level match of the ASR transcript against the target (current approach), (b) later add per-phoneme GOP using a CTC phoneme recogniser exported to ONNX and run through sherpa-onnx/onnxruntime — a research-grade feature, not a quick win.

---

## 4. On-device small LLM for a tutor/grammar feature

### 4.1 Runtimes

* **llama.rn** (llama.cpp binding, GGUF) — generic path for Qwen3/Gemma/Llama GGUF files; measured by third parties with Q4_K_M 1B at 12–18 tok/s on Snapdragon 6 Gen 3, 18–25 on SD 7 Gen 3, 22–28 on SD 7+ Gen 3, 20–28 on Dimensity 8300; 3B at 4–7 tok/s on SD 6 Gen 3; 1B ≈600 MB on disk / ≈800 MB RAM, 3B ≈1.7 GB / ≈2.2 GB RAM; Vulkan adds ≈20–40 % [50].
* **react-native-executorch** (Software Mansion, Meta ExecuTorch) — Llama 3.2 1B SpinQuant 1.14 GB needs ≈1.9–2 GB RAM and runs 40 tok/s on Galaxy S24, 48 on OnePlus 12, 16.5 on iPhone SE 3; 3B SpinQuant 2.55 GB needs ≈3.7 GB RAM [49].
* **ML Kit GenAI (Gemini Nano)** — Summarization/Proofreading/Rewriting/Image description (Beta) on Pixel 9–11 and listed Samsung/OnePlus/Xiaomi/OPPO/vivo devices; Prompt API (Beta) tiered by nano-v2/v3/v4; language support "may vary"; foreground-only; per-app quotas (`ErrorCode.BUSY`) [48]. Free and zero-download for users on supported devices, but not a universal path and not documented for ja/ko/zh/vi.
* **MLC-LLM** — not re-verified here; comparable to llama.cpp paths.

### 4.2 Models

* **Qwen3-1.7B / 0.6B** — Apache-2.0, official GGUFs from ggml-org (Q4 ≈1 GB for 1.7B; 0.6B considerably smaller) [52]; claims 119-language coverage (vendor claim, not benchmarked here). Best Apache option with Vietnamese/CJK exposure.
* **Gemma 3n E2B/E4B** — "gemma" licence (Google Gemma Terms, gated download); E2B ≈6B raw / ≈2B effective footprint; trained on 140+ spoken languages; designed for low-resource devices [51]. Strong multilingual, but the Gemma Terms are not an OSI licence → record in ATTRIBUTIONS and review the use policy.
* **Llama 3.2 1B/3B** — Llama Community Licence; SpinQuant builds packaged for ExecuTorch [49]. Weak on vi/ja/ko relative to Qwen/Gemma (general community experience; not benchmarked here).
* **Phi-4-mini, SmolLM3** — not researched in depth; MIT/Apache respectively per vendor pages (unverified here).

### 4.3 Verdict

An on-device tutor is feasible on ≥6 GB-RAM phones with a **downloaded** 0.6–1.7B Q4 model (never bundled; APK stays small), with 10–25 tok/s on mid-range SoCs [50]. Quality for free-form ja/ko/zh/vi grammar feedback at ≤2B is modest; constrain the task (short correction + one-line explanation, JSON output, few-shot in the target language).

**BYO-key cloud option (recommended default for grammar feedback):**

| Provider / model | Input $/1M | Output $/1M | Notes |
|---|---|---|---|
| Google Gemini 3.1 Flash-Lite | 0.25 | 1.50 | free tier exists (data used for product improvement on free tier); batch/flex 0.125 / 0.75 [53] |
| Google Gemini 3.5 Flash-Lite | 0.30 | 2.50 | [53] |
| OpenAI gpt-5-nano | 0.05 | 0.40 | gpt-5-mini 0.25 / 2.00 (third-party pricing table dated Aug 2026; OpenAI's own page could not be fetched) [55] |
| DeepSeek `deepseek-flash` (V4.1-Flash) | 0.15 (off-peak) – 0.30 (peak); cache-hit 0.003–0.006 | 0.60 – 1.20 | peak hours 01–04 and 06–10 UTC weekdays [54] |

A typical feedback call (≈400 input + 150 output tokens) costs well under $0.001 on any of these, so a BYO key is affordable for learners; design the feature so the key is stored in SecureStore and requests go directly from device to provider (no backend needed).

---

## 5. Graded / comprehensible-input text and image sets

### 5.1 Text

| Source | Licence | Use |
|---|---|---|
| Tatoeba per-language exports + links + audio index [9] | CC BY 2.0 FR; CC0 subset; audio per contributor | Example sentences for every lexicon item (filter by length/frequency coverage for A1); ja/en Tanaka subset is PD. |
| Common Voice sentence text (`server/data`, Sentence Collector + Wikipedia extractor) | CC0 [56]; audio clips CC0 [57] | Short, simple sentences in de/es/it/pt/ja/ko/zh/vi/en; the CC0 audio clips can seed listening-discrimination items (quality varies). |
| Wikipedia / Simple English Wikipedia, Wiktionary examples | CC BY-SA 4.0 (standard Wikimedia terms) | Reading passages after simplification at build time; share-alike compatible with your data licence. |
| Project Gutenberg / Aozora Bunko (ja) | Public domain (per work; not re-verified) | Not A1-level; use for later bands. |
| OpenSubtitles (OPUS) | OPUS page could not be fetched; the derived frequency lists are CC BY-SA via FrequencyWords [1] | Do not ship subtitle text. |
| Open CEFR graded readers | None with open licences found for these languages | Generate short A1 texts at build time with an LLM, constrained to your lexicon, and review by native speakers; licence them yourself under CC BY-SA. |

### 5.2 Images / icons for vocabulary

| Set | Licence | Notes |
|---|---|---|
| OpenMoji (4,495 emojis) | CC BY-SA 4.0 [58] | Share-alike matches your data licence; consistent style; includes many "extras" beyond Unicode. |
| Twemoji | Graphics CC BY 4.0, code MIT; credit in README/About/Settings is accepted by the project [59] | Permissive; large vocabulary coverage via emoji. |
| Noto Emoji | Fonts OFL 1.1; SVG/PNG artwork Apache-2.0; region flags PD [60] | Permissive; good for monochrome/outline style. |
| Wikimedia Commons | per file (CC0/CC BY/CC BY-SA) | For concrete nouns needing photos; track per-file attribution. |

---

## 6. Vietnamese as source/UI language — consolidated

* **Dictionaries:** kaikki English edition `translations[]` (vi) and the raw `vi` edition, CC BY-SA/GFDL [4][5]; OVDP/FVDP GPLv2 — not mergeable into CC BY-SA data [24]; Urimalsaem (ko, CC BY-SA 2.0 KR) and CC-CEDICT (zh, CC BY-SA 3.0) give EN pivots that you can translate to VI at build time [21][22].
* **Frequency/levels for VI (for an EN-for-Vietnamese course you need vi only as L1):** FrequencyWords `vi` (CC BY-SA 4.0) [1]; wordfreq `vi` [2]; Leipzig `vie` (CC BY) [3].
* **TTS for UI/explanations:** Piper `vi_VN-vais1000-medium` (dataset CC BY 4.0) [27]; `vivos` is CC BY-NC-SA [27] → avoid; MMS `vie` CC BY-NC [35] → avoid; Supertonic 3 vi (OpenRAIL-M) [36]. Kokoro has no vi [30]. expo-speech: Google engine lists Vietnamese [38].
* **ASR for VI (if needed):** sherpa-onnx vi-30M int8 26 MB [43]; Vosk small-vn 32 MB Apache [46]; Moonshine vi base [45].

---

## 7. Recommended content stack per language (field mapping)

Common ETL (all languages): `kaikki.org` JSONL → filter `pos ∈ {noun, verb, adj, adv, pron, det, num, prep, conj, interj}` → join frequency rank from FrequencyWords (primary) and wordfreq (secondary) → assign CEFR band from the language-specific anchor list, with a frequency-based fallback (e.g. top-N by rank until A1 target size ≈600–800 lemmas) → pull 1–3 example sentences (kaikki `senses[].examples` with `translation`, else Tatoeba linked pairs) → VI gloss from kaikki `translations[]` (`code: vi`) with LLM fallback flagged for review → synthesise audio with the voice listed → Whisper/SenseVoice round-trip audit.

| Lang | Lemma/POS/forms | Gender/article | Frequency rank | CEFR anchor | EN gloss | VI gloss | Examples | Audio voice |
|---|---|---|---|---|---|---|---|---|
| de | kaikki de (`forms[]` cases/plural/conjugation) [8] | sense tags `masculine/feminine/neuter` + `de-noun` args [8] | FrequencyWords de [1] / wordfreq [2] | Goethe A1 list as selector only [10] | kaikki glosses | kaikki `translations[vi]`, fallback LLM | kaikki examples, Tatoeba deu [9] | Piper thorsten (CC0) / kerstin (CC0) [27] |
| es | kaikki es (`es-conj` 212 forms) [7] | sense tags | FrequencyWords es | frequency-derived; PCIC reference only | kaikki | kaikki/LLM | kaikki, Tatoeba spa | Piper davefx (CC0) / claude es-MX (Apache) [27] |
| it | kaikki it | sense tags | FrequencyWords it | frequency-derived (Kelly it licence unclear [11]) | kaikki | kaikki/LLM | kaikki, Tatoeba ita | Kokoro it (Apache) [30] |
| pt | kaikki pt | sense tags | SUBTLEX-PT (CC BY) [18] + FrequencyWords pt | frequency-derived | kaikki | kaikki/LLM | kaikki, Tatoeba por | Piper faber/cadu/jeff (CC0), tugão pt-PT (CC0) [27] |
| ja | JMdict (CC BY-SA 4.0, About-screen attribution) [19] + kaikki ja; readings precomputed (kuroshiro/MeCab at build) [25] | n/a | wordfreq ja [2] | openjlpt N5/N4 (CC BY-SA 4.0) [20] | JMdict glosses | kaikki/LLM | Tatoeba jpn (Tanaka PD) [9], openjlpt examples [20] | MeloTTS-JP (MIT) [31] or Kokoro ja [30] |
| ko | kaikki ko + Urimalsaem (CC BY-SA 2.0 KR) [22]; romanisation precomputed | n/a | NIKL list rank (KOGL-1) [13] + wordfreq ko | NIKL levels A/B/C → A1≈A [13] | kaikki / NIKL learner dict (verify terms) [23] | kaikki/LLM | Tatoeba kor | MeloTTS-KR (MIT) [31]; alt. Supertonic 3 [36] |
| zh | CC-CEDICT (CC BY-SA 3.0) [21] + kaikki zh; pinyin precomputed from CEDICT | n/a (measure words from kaikki) | wordfreq zh [2] / FrequencyWords zh_cn | HSK 3.0 level 1–2 via ivankra/hsk30 (facts; cite) [12] | CEDICT | kaikki/LLM | Tatoeba cmn (+ transcriptions export) [9] | MeloTTS-ZH (MIT) [31] |
| en | kaikki en | n/a | FrequencyWords en / NGSL rank [16] | CEFR-J A1 (cite) [15] | — | kaikki `translations[vi]` / LLM | kaikki, Tatoeba eng | Kokoro en (Apache) [30] |
| vi (UI) | kaikki vi | n/a | FrequencyWords vi | — | — | — | Tatoeba vie | Piper vais1000 (CC BY 4.0) [27] |

### Licence-compatibility notes for the app (MIT code + CC BY-SA data + ATTRIBUTIONS.md)

1. **CC BY-SA 4.0 inputs** (kaikki/Wiktionary, FrequencyWords, wordfreq data, JMdict/KANJIDIC2, openjlpt, NGSL, Octanove, OpenMoji) combine cleanly into a CC BY-SA 4.0 content DB. Keep data in separate files from the MIT code so the share-alike never reaches the code. JMdict additionally requires the acknowledgement on a dedicated About/Sources screen and inclusion or linking of the licence files [19].
2. **CC BY-SA 3.0 (CC-CEDICT)** and **CC BY-SA 2.0 KR (Urimalsaem)**: 3.0 permits adaptations under later versions, so merging into a 4.0 DB is allowed one-way; for 2.0 KR, keep the Korean dictionary data as its own file under its own licence and note it separately rather than relicensing. (Standard CC compatibility rules; confirm with the CC compatibility chart.)
3. **CC BY / CC0 / PD / Apache-2.0 / MIT** inputs (Tatoeba text, SUBTLEX-PT, Common Voice sentences, Piper CC0/CC BY voices, Kokoro, MeloTTS, Twemoji, Noto) are compatible with both your MIT code and CC BY-SA data; list each with its required citation (wordfreq wants the Zenodo DOI [2]; SUBTLEX-PT wants the Soares 2015 citation [18]; Twemoji accepts an About-screen credit [59]).
4. **KOGL Type 1** (NIKL list) requires source credit; it is a government open licence, not CC — keep the file separate and attribute [13].
5. **GPL** (FVDP/OVDP [24], piper1-gpl runtime [28]): use only at build time; nothing GPL ships in the APK. Classic Piper (MIT) voices are fine because what ships is the audio, not the model.
6. **Non-commercial** (MMS-TTS [35], VIVOS [27], likely KSS/Baker): avoid for shipped audio; if the app is non-commercial, still document it.
7. **No-licence / unknown** (Oxford 3000 [14], Goethe Wortliste [10], CEFRLex index [17], Piper it/zh "See URL"/"Unknown" voices [27], Kelly non-Swedish [11], SUBTLEX-DE/ESP): treat as references for human decisions only; do not copy entries.
8. **Model licences with use restrictions** (Gemma Terms [51], OpenRAIL-M [36]): allowed with conditions; record the licence text version in ATTRIBUTIONS.md and keep the model as a user-initiated download, not an APK asset.
9. **Synthesised audio**: the audio is a derivative of the voice model whose dataset licence governs (CC0/CC BY → yours to license as CC BY-SA with attribution; CC BY-SA dataset such as daniela → audio must stay CC BY-SA [27]).

---

## Sources

1. hermitdave/FrequencyWords README (MIT code, CC BY-SA 4.0 content; OpenSubtitles2016/2018) — https://github.com/hermitdave/FrequencyWords
2. rspeer/wordfreq README (Apache code, CC BY-SA 4.0 data, language table, sunset note, citation) — https://github.com/rspeer/wordfreq
3. Leipzig Corpora Collection catalogue entry quoting "CC BY-NC" (general) and "All corpora provided for download are licensed under CC BY" — https://sprogressource.digst.govcloud.dk/dataset/leipzig-corpora-collection
4. kaikki.org dictionary index (licence "same licenses as Wiktionary – both CC-BY-SA and GFDL"; sense counts) — https://kaikki.org/dictionary/
5. kaikki.org raw Wiktextract data page (editions en, zh, cs, nl, fr, de, el, id, it, ja, ko, ku, ms, pl, pt, ru, simple, es, th, tr, vi) — https://kaikki.org/dictionary/rawdata.html
6. tatuylonen/wiktextract README (JSON fields, MIT code) — https://github.com/tatuylonen/wiktextract
7. kaikki.org entry for Spanish "hablar" (forms with tags, IPA, examples with translation) — https://kaikki.org/dictionary/Spanish/meaning/h/ha/hablar.jsonl
8. kaikki.org entry for German "Haus" (neuter/strong tags, genitive/plural forms, IPA, de-noun head template) — https://kaikki.org/dictionary/German/meaning/H/Ha/Haus.jsonl
9. Tatoeba downloads page (CC BY 2.0 FR, CC0 subset, Tanaka PD, per-contributor audio licence, export types) — https://tatoeba.org/en/downloads
10. Goethe-Institut, Goethe-Zertifikat A1 / Start Deutsch 1 Wortliste PDF (≈650 entries; no licence notice) — https://www.goethe.de/pro/relaunch/prf/ca/A1_SD1_Wortliste_02.pdf
11. Språkbanken, Kelly project page (9 languages; Swedish list CC BY-SA 3.0 + LGPL 3.0; others unstated) — https://spraakbanken.gu.se/node/100
12. ivankra/hsk30 (11,092 terms; MIT code; copyright caveat on PRC MoE source) — https://github.com/ivankra/hsk30
13. National Institute of Korean Language, 한국어 학습용 어휘 목록 (5,965 words, 3 levels, KOGL Type 1) — https://www.korean.go.kr/front_eng/down/down_02V.do?etc_seq=70
14. Oxford Learner's Dictionaries, Oxford 3000/5000 wordlists page (no licence stated) — https://www.oxfordlearnersdictionaries.com/about/wordlists/
15. openlanguageprofiles/olp-en-cefrj (CEFR-J profile free incl. commercial with citation; Octanove C1/C2 CC BY-SA 4.0) — https://github.com/openlanguageprofiles/olp-en-cefrj
16. New General Service List 1.2 (2,809 words, CC BY-SA 4.0, frequency statistics) — https://www.newgeneralservicelist.com/new-general-service-list
17. CEFRLex (DAFlex, EFLLex, ELELex, FLELex, NT2Lex, SVALex, SweLLex; licence not stated on index) — https://cental.uclouvain.be/cefrlex
18. Lingua Libre template for SUBTLEX-PT (licence CC-BY; Soares et al. 2015 citation) — https://lingualibre.org/wiki/Template:SUBTLEX-PT
19. EDRDG licence statement (JMdict, KANJIDIC2 CC BY-SA 4.0; app attribution on separate About/Sources screen) — https://www.edrdg.org/edrdg/license.html
20. openjlpt on PyPI (8,334 words, 2,211 kanji; Waller lists CC BY, KANJIDIC2, Tatoeba; dataset CC BY-SA 4.0) — https://pypi.org/project/openjlpt/
21. Wikipedia, "CEDICT" (CC-CEDICT CC BY-SA 3.0; 123,524 entries as of 16 Jul 2025; format; MDBG download) — https://en.wikipedia.org/wiki/CEDICT
22. Wikipedia, "Urimalsaem" (NIKL; CC BY-SA 2.0 KR) — https://en.wikipedia.org/wiki/Urimalsaem
23. Wikipedia, "Basic Korean Dictionary" (NIKL learner dictionaries; licence not stated) — https://en.wikipedia.org/wiki/Basic_Korean_Dictionary
24. OVDP / Free Vietnamese Dictionary Project on SourceForge (GPLv2; AnhViet.zip) — https://sourceforge.net/p/ovdp/
25. hexenq/kuroshiro (MIT; kuromoji browser analyser, MeCab Node-only) — https://github.com/hexenq/kuroshiro
26. rhasspy/piper VOICES.md (voice list per language; no ja/ko) — https://github.com/rhasspy/piper/blob/master/VOICES.md
27. rhasspy/piper-voices MODEL_CARD files on Hugging Face (per-voice dataset licences quoted in §2.2) — https://huggingface.co/rhasspy/piper-voices
28. OHF-Voice/piper1-gpl (GPL-3.0; embeds espeak-ng) — https://github.com/OHF-Voice/piper1-gpl
29. hexgrad/Kokoro-82M model card (Apache-2.0; 82M params; training-data policy) — https://huggingface.co/hexgrad/Kokoro-82M
30. hexgrad/Kokoro-82M VOICES.md (per-language voices and grades; "non-English languages may be absent or thin") — https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
31. myshell-ai/MeloTTS (MIT; en/es/fr/zh/ja/ko; CPU real-time) — https://github.com/myshell-ai/MeloTTS
32. sherpa-onnx TTS pretrained models index (Matcha, Kokoro, Kitten, VITS families) — https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/index.html
33. sherpa-onnx VITS TTS models page (vits-melo-tts-zh_en 163 MB; Chinese VITS models) — https://k2-fsa.github.io/sherpa/onnx/tts/pretrained_models/vits.html
34. Hugging Face model lookups: csukuangfj/vits-mimic3-ko_KO-kss_low exists; facebook/mms-tts-{kor,vie,deu,spa,por} exist, {jpn,ita,cmn} not found — https://huggingface.co/csukuangfj/vits-mimic3-ko_KO-kss_low
35. facebook/mms-tts-vie model card (VITS; CC BY-NC 4.0) — https://huggingface.co/facebook/mms-tts-vie
36. Supertone/supertonic-3 model card (99M; ONNX; 31 languages incl. ko/ja/vi/de/es/it/pt, no zh; OpenRAIL-M) — https://huggingface.co/Supertone/supertonic-3
37. XDcobra/react-native-sherpa-onnx (MIT; RN ≥0.70; TurboModule; TTS, offline/streaming STT; sherpa-onnx 1.12.35) — https://github.com/XDcobra/react-native-sherpa-onnx
38. Wikipedia, "Speech Services" (Google TTS language list incl. ja/ko/zh/vi/de/es/it/pt; "Users must install voice data for each language") — https://en.wikipedia.org/wiki/Speech_Services
39. jamsch/expo-speech-recognition README (on-device Android 13+/iOS 17+; offline model download API; installedLocales caveat) — https://github.com/jamsch/expo-speech-recognition
40. ggerganov/whisper.cpp models README on Hugging Face (model sizes incl. q5_1/q8_0) — https://huggingface.co/ggerganov/whisper.cpp
41. mybigday/whisper.rn (MIT; Core ML; Hexagon NPU; VAD; Expo prebuild) — https://github.com/mybigday/whisper.rn
42. sherpa-onnx streaming Zipformer transducer models (zh, ko, en sizes) — https://k2-fsa.github.io/sherpa/onnx/pretrained_models/online-transducer/zipformer-transducer-models.html
43. sherpa-onnx offline Zipformer transducer models (ja ReazonSpeech, vi, zh-en, ru sizes) — https://k2-fsa.github.io/sherpa/onnx/pretrained_models/offline-transducer/zipformer-transducer-models.html
44. sherpa-onnx SenseVoice page (zh/yue/en/ja/ko; int8 226–228 MB; RTF on Cortex-A55/A76) — https://k2-fsa.github.io/sherpa/onnx/sense-voice/pretrained.html
45. Moonshine "Available models" docs (per-language models and WER/CER) — https://mintlify.wiki/moonshine-ai/moonshine/models/available-models
46. Vosk models page (per-language sizes, licences, WER) — https://alphacephei.com/vosk/models
47. "Segmentation-Free Goodness of Pronunciation" (arXiv 2507.16838) — https://arxiv.org/abs/2507.16838
48. Google ML Kit GenAI APIs overview (Beta APIs; device tiers; language support varies; foreground-only; quotas) — https://developers.google.com/ml-kit/genai
49. react-native-executorch useLLM docs (Llama 3.2 sizes, memory, tok/s per device) — https://docs.swmansion.com/react-native-executorch/docs/llms/useLLM
50. ertas.ai, "LLM Android benchmarks: Snapdragon, Tensor" (1B/3B Q4_K_M tok/s by chipset; RAM) — https://www.ertas.ai/blog/llm-android-benchmarks-snapdragon-tensor
51. google/gemma-3n-E2B-it model card (Gemma licence; effective 2B; 140+ languages) — https://huggingface.co/google/gemma-3n-E2B-it
52. ggml-org/Qwen3-1.7B-GGUF (official GGUF builds; Apache-2.0 model) — https://huggingface.co/ggml-org/Qwen3-1.7B-GGUF
53. Google AI for Developers, Gemini API pricing (Flash/Flash-Lite prices, free tier) — https://ai.google.dev/gemini-api/docs/pricing
54. DeepSeek API pricing (deepseek-flash / v4-pro; peak/off-peak; cache hit) — https://api-docs.deepseek.com/quick_start/pricing
55. morphllm, "OpenAI API Pricing (2026)" (gpt-5-nano, gpt-5-mini etc.; page updated 2026-08-21; OpenAI's own page could not be fetched) — https://morphllm.com/openai-api-pricing
56. common-voice/common-voice README (sentence text released under CC0) — https://github.com/common-voice/common-voice
57. Wikipedia, "Common Voice" (CC0 voice database; 250+ languages) — https://en.wikipedia.org/wiki/Common_Voice
58. OpenMoji (4,495 emojis, CC BY-SA 4.0) — https://openmoji.org/
59. jdecked/twemoji (graphics CC BY 4.0, code MIT; About-screen credit accepted) — https://github.com/jdecked/twemoji
60. googlefonts/noto-emoji (fonts OFL 1.1; SVG/PNG Apache-2.0; flags PD) — https://github.com/googlefonts/noto-emoji
