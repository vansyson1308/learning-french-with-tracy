# zh-vi assessment research base (clean-room)

Authored for this project (P4d, 2026-11-04). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Chinese objectives
were derived. **No CEFR descriptor text and no text of the HSK standard is reproduced
anywhere in this repository.** The structure follows the RESEARCH.md of the French,
Spanish, German, Italian, English and Japanese courses; what they say about the
framework model, the claim gate and parallel forms applies unchanged and is not
repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Chinese Proficiency Grading Standards for International Chinese Language Education
  (GF0025-2021)**, Ministry of Education of the PRC and the National Language
  Commission, 2021 (HSK 3.0). Each objective is filed under an HSK band and skill by
  name in `content/zh/_drafts/objectives/hsk-standard.json`
  (`checkedAgainstOfficialSource: false` until checked).
- **HSK 3.0 word levels**: ivankra/hsk30 (MIT), a transcription of the standard's word
  list, used as a build-time anchor (`content/zh/lexicon/derived/hsk-course.json`).
  HSK bands are not CEFR levels, and this course never says that they are.

## How the Chinese objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Mandarin and for Vietnamese adults who work or will work for a
Chinese-speaking employer, in China, in Taiwan or in Vietnam
(`plan/authoring/briefs/zh-vi.md`): scenarios at a factory, a warehouse, a shop, a
bank, a clinic and on the phone replace some travel settings. The script and grammar
families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `zh.obj.script.pinyin_tones` | pinyin and four tones plus the neutral tone; the primer before Section 1 (brief §2, §3.1-3.2) |
| `zh.obj.script.hanzi_hanviet` | characters remembered through Hán-Việt where the reading helps (brief §2, §3.4-3.5) |
| `zh.obj.writing.pinyin_input` | typing characters through a pinyin keyboard and choosing the right one (brief §2) |
| `zh.obj.sentences.shi_questions` | 是, 不 and 没, 吗 and A不A (brief §3.6) |
| `zh.obj.numbers.measure_words` | measure words, like Vietnamese classifiers but obligatory after numbers; 两 against 二 (brief §3.7) |
| `zh.obj.existence.you_zai` | 有 and 在 (brief §3.8) |
| `zh.obj.grammar.word_order` | modifier with 的 before the noun, time and place before the verb (brief §3.9-3.10) |
| `zh.obj.aspect.le_guo_zai` | 了, 过, 在/正在, 着 against Vietnamese rồi, từng, đang (brief §3.11) |
| `zh.obj.modals.can_want` | 想, 要, 能, 会, 可以; kept at A2 *supports* (brief §3.12) |
| `zh.obj.questions.question_words` | question words in place (brief §3.14) |
| `zh.obj.adjectives.hen_tai` | 很 and 太…了, no 是 before an adjective (brief §3.15) |
| `zh.obj.politeness.register` | 您, 请, titles at work (brief §3.16) |
| `zh.obj.pronunciation.tones_sounds` | tone pairs, sandhi of 不, 一 and 3-3, retroflex sounds (brief §2, §3.2-3.3) |
| `zh.obj.strategy.hanviet_false_friends` | Hán-Việt and false friends (brief §2, §3.5) |

The speaking objectives cue meaning in **Vietnamese**; the Chinese target is never
shown before the attempt. Speech is recognised with the `zh-CN` recogniser; simplified
and traditional transcripts count as the same words (P4b traditional fold).

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
  Companion Volume descriptor sentences or text of the HSK standard.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

HSK 3.0 levels 1-2 are anchors for word choice only (`content/zh/lexicon/REVIEW.md`).
A list level is never an input to a level claim, and vocabulary or character counts
never are.

## Exam track

The HSK 1-2 practice track (later session) reproduces the public format of the
sections — 听力, 阅读, and 书写 at level 2 — with original items only, never past
papers. Its readiness message is "mức sẵn sàng ước tính", never a promise to pass.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognized words only for
speech (never a tone or pronunciation-quality score), rubric slots for writing,
deterministic scenarios for interaction. Pinyin typed for a key in characters is
accepted but is practice, not production evidence. The A1 estimate is a CEFR-aligned
estimate, not an official examination or certification.
