# ja-vi assessment research base (clean-room)

Authored for this project (P4c, 2026-11-03). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Japanese objectives
were derived. **No CEFR descriptor text and no JF Standard Can-do text is reproduced
anywhere in this repository.** The structure follows the RESEARCH.md of the French,
Spanish, German, Italian and English courses; what they say about the framework model,
the claim gate and parallel forms applies unchanged and is not repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **The Japan Foundation, JF Standard for Japanese-Language Education 2010**:
  https://jfstandard.jp/ — the JF Standard uses the CEFR levels. Each objective is
  filed under a JF activity category by name in `content/ja/_drafts/objectives/jf-standard.json`
  (`checkedAgainstOfficialSource: false` until the tree is checked).
- **JLPT**: the Japan Foundation and JEES publish no official vocabulary, kanji or
  grammar lists; the N5/N4 word lists used to choose words are community lists
  (OpenJLPT 0.1.0, levels from Jonathan Waller's lists). JLPT N5 is not a CEFR level,
  and this course never says that it is.

## How the Japanese objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Japanese and for Vietnamese adults who work or will work in Japan
(`plan/authoring/briefs/ja-vi.md`): scenarios at a factory, a konbini, a city office,
a clinic and on the phone to an employer replace some travel settings. The script and
grammar families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `ja.obj.script.kana` | three scripts; the kana primer before Section 1 (brief §2, §3.1) |
| `ja.obj.script.kanji_hanviet` | about 100 kanji, remembered through Hán-Việt (brief §2, §3.2) |
| `ja.obj.writing.kana_input` | typing kana with long vowels, っ and ん (brief §2) |
| `ja.obj.sentences.noun_desu` | AはBです (brief §3.3) |
| `ja.obj.particles.core` | particles mark roles that Vietnamese shows by word order (brief §3.4-3.5) |
| `ja.obj.verbs.masu_forms` | the verb changes for tense, negation and politeness; SOV order (brief §3.6, §3.16) |
| `ja.obj.verbs.te_form` | requests, rules and the progressive (brief §3.7) |
| `ja.obj.adjectives.i_na` | adjectives that conjugate (brief §3.8) |
| `ja.obj.existence.aru_iru` | one Vietnamese "có", two Japanese verbs (brief §3.9) |
| `ja.obj.numbers.counters` | counters, like Vietnamese classifiers but many more (brief §3.10-3.11) |
| `ja.obj.questions.question_words` | か and question words in place (brief §3.12) |
| `ja.obj.wants.tai_suki` | たい, 欲しい, 好き; kept at A2 *supports* (brief §3.13) |
| `ja.obj.politeness.levels` | です/ます against the plain style; さん (brief §3.14, §3.18) |
| `ja.obj.pronunciation.length_pitch` | long vowels, double consonants, pitch is not tone (brief §2, §3.15) |
| `ja.obj.strategy.hanviet_loanwords` | Hán-Việt and katakana loans, false friends (brief §2, §3.17) |

The speaking objectives cue meaning in **Vietnamese**; the Japanese target is never
shown before the attempt. Speech is recognised with the `ja-JP` recogniser; kana and
kanji transcripts count as the same words (P4b reading layer).

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
| `cefr-cv-2020:conversation` | Conversation (spoken interaction) |
| `cefr-cv-2020:sociolinguistic-appropriateness` | Sociolinguistic appropriateness |
| `cefr-cv-2020:vocabulary-range` | Vocabulary range |
| `cefr-cv-2020:grammatical-accuracy` | Grammatical accuracy |
| `cefr-cv-2020:orthographic-control` | Orthographic control |
| `cefr-cv-2020:phonological-control` | Phonological control |
| `cefr-cv-2020:identifying-cues-inferring` | Identifying cues and inferring (reception strategy) |
| `cefr-cv-2020:overall-reading-comprehension` | Overall reading comprehension |
| `cefr-cv-2020:overall-listening-comprehension` | Overall listening comprehension |
| `cefr-cv-2020:audio-media-recordings` | Listening to audio media and recordings |
| `cefr-cv-2020:announcements-instructions` | Listening to announcements and instructions |
| `cefr-cv-2020:understanding-conversation` | Understanding conversation between other speakers |
| `cefr-cv-2020:reading-correspondence` | Reading correspondence |
| `cefr-cv-2020:reading-orientation` | Reading for orientation |
| `cefr-cv-2020:overall-oral-production` | Overall oral production |
| `cefr-cv-2020:sustained-monologue-describing` | Sustained monologue: describing experience |
| `cefr-cv-2020:sustained-monologue-giving-information` | Sustained monologue: giving information |
| `cefr-cv-2020:overall-written-production` | Overall written production |
| `cefr-cv-2020:overall-written-interaction` | Overall written interaction |
| `cefr-cv-2020:notes-messages-forms` | Notes, messages and forms |
| `cefr-cv-2020:correspondence` | Correspondence |
| `cefr-cv-2020:overall-oral-interaction` | Overall oral interaction |
| `cefr-cv-2020:information-exchange` | Information exchange |
| `cefr-cv-2020:obtaining-goods-services` | Obtaining goods and services |

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences or JF Standard Can-do statements.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

OpenJLPT N5 and N4 are anchors for word choice only (`content/ja/lexicon/derived/jlpt-course.json`,
`content/ja/lexicon/REVIEW.md`). A list level is never an input to a level claim, and
vocabulary or kanji counts never are.

## Exam track

The JLPT N5 practice track (later session) reproduces the public format of the
sections — 文字・語彙, 文法・読解, 聴解 — with original items only, never past papers. Its
readiness message is "mức sẵn sàng ước tính", never a promise to pass.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognized words only for
speech (never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. Kana typed for a kanji key is accepted but is practice, not
production evidence. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.
