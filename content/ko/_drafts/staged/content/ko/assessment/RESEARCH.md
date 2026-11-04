# ko-vi assessment research base (clean-room)

Authored for this project (P4e, 2026-11-05). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Korean objectives
were derived. **No CEFR descriptor text and no TOPIK item, can-do or syllabus text is
reproduced anywhere in this repository.** The structure follows the RESEARCH.md of the
French, Spanish, German, Italian, English and Japanese courses; what they say about the
framework model, the claim gate and parallel forms applies unchanged and is not repeated
here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **TOPIK I (한국어능력시험 I)**, National Institute for International Education:
  https://www.topik.go.kr/ — levels 1 and 2; sections 듣기 (listening) and 읽기 (reading).
  Each objective names the TOPIK I section it prepares in
  `content/ko/_drafts/objectives/topik-references.json`, checked on 2026-11-05 against the
  administrator's regulation (기본운영규정 제204호, 2024.9.12; content/ko/exam/FORMAT-SOURCES.md:
  듣기 30 items / 40 min, 읽기 40 items / 60 min, 1급 from 80 and 2급 from 140 of 200). TOPIK levels are not
  CEFR levels, and this course never says that they are.
- **EPS-TOPIK** (the Employment Permit System test run by HRD Korea) shares the scenario
  world of this course — factory, farm, safety, the employment centre — but the course
  reproduces neither its items nor its word list.

## How the Korean objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Korean and for Vietnamese adults who work or will work in Korea (EPS):
scenarios at a factory, a farm, a convenience store, the employment centre (고용센터), a
bank, a clinic and on the phone to an employer replace some travel settings. The script
and grammar families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `ko.obj.script.hangul` | an alphabet in syllable blocks; the Hangul primer before Section 1 |
| `ko.obj.script.hanviet` | Sino-Korean words share Hán-Việt roots (가족 gia tộc) |
| `ko.obj.writing.hangul_input` | typing blocks with a final consonant; from Section 2 on |
| `ko.obj.sentences.copula` | N이에요/예요 at the end, where Vietnamese puts "là" in the middle |
| `ko.obj.particles.core` | particles mark roles that Vietnamese shows by word order; two forms each |
| `ko.obj.verbs.haeyo_present` | the verb changes and comes last (SOV) |
| `ko.obj.verbs.past_future` | the ending carries tense, where Vietnamese uses đã / sẽ |
| `ko.obj.verbs.requests_rules` | -(으)세요, -지 마세요, -아/어도 돼요: the language of workplace rules |
| `ko.obj.negation.an_mot` | 안 (don't) against 못 (can't); one Vietnamese "không" |
| `ko.obj.existence.itda` | 있어요/없어요 for "có" and "không có" |
| `ko.obj.numbers.two_systems` | Sino-Korean and native numbers, each with its counters |
| `ko.obj.politeness.speech_levels` | 해요체 by default, 합쇼체 in set phrases and at work, 반말 recognised |
| `ko.obj.pronunciation.batchim_sounds` | plain / tense / aspirated consonants; finals that move or change |
| `ko.obj.strategy.hanviet_loanwords` | Hán-Việt and English loans, false friends (공장, 출구, 시험) |

The speaking objectives cue meaning in **Vietnamese**; the Korean target is never
shown before the attempt. Speech is recognised with the `ko-KR` recogniser; spacing in a
transcript is ignored (P4b ko plugin).

## Audio (QC 2026-11-05 §2.1)

ko-vi bundles no audio yet (D-11: no Korean voice with a clean lineage). Listening items
are graded through the device's own Korean voice when one is installed; without one an
item says so, gives the install hint and is skipped. A skipped item is no evidence, so
the claim gate counts only listening items the learner actually heard.

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
  Companion Volume descriptor sentences or TOPIK material.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

No allowlisted Korean learner list can be fetched: the NIKL 한국어 학습용 어휘 목록 (KOGL
Type 1) is an owner download (OWNER-FINAL-CHECKLIST C). Word choice is anchored on
frequency (`content/ko/lexicon/REVIEW.md`). A list level is never an input to a level
claim, and vocabulary counts never are.

## Exam track

The TOPIK I practice track (later session) reproduces the public format of 듣기 and 읽기
with original items only, never past papers. Its readiness message is "mức sẵn sàng ước
tính", never a promise to pass.

## Assessment limitations

As for the other courses: recognized words only for speech (never a pronunciation-quality
score), rubric slots for writing, deterministic scenarios for interaction. Listening is
heard through the device voice, whose quality varies by phone; an item the learner could
not hear counts nowhere. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.
