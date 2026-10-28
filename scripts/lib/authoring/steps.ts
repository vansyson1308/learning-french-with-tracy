/**
 * Authoring toolkit (P3c) — the step registry. Each step names the
 * learner-facing artifact it drafts, the zod schema one OUTPUT.jsonl
 * record must satisfy, where ingested records land, which validator
 * family judges them, and how the prompt bundle is assembled (blueprint
 * slice, allowed ids, French exemplars). Everything here is offline and
 * deterministic; Claude only ever sees the emitted PROMPT.md + INPUT.json.
 */

import { existsSync } from "fs";
import { z } from "zod";

import {
  POS_VALUES,
  checkpointSchema,
  examTrackSchema,
  conceptSchema,
  courseObjectiveSchema,
  interactionScenarioSchema,
  listeningClipSchema,
  paradigmTableSchema,
  placementStageSchema,
  readingSourceSchema,
  speechItemSchema,
  storySourceSchema,
  writingTaskSchema,
  ExerciseSchema,
  WordSchema,
  type PackSource,
} from "../../../content/schema";
import { buildPlugin } from "../languages";
import { readJson, safeResolve } from "../pipeline";

export const STEP_IDS = [
  "objectives",
  "units",
  "lessons",
  "concepts",
  "readings",
  "listening",
  "speech",
  "writing",
  "scenarios",
  "checkpoints",
  "placement",
  "exam",
  "lexicon-review",
  "lexicon-add",
  "stories",
] as const;
export type StepId = (typeof STEP_IDS)[number];

/** A draft unit (units step): the unit without exercises — lessons are stubs the lessons step fills. */
export const draftUnitSchema = (lang: string) =>
  z.strictObject({
    sectionId: z.string().regex(new RegExp(`^${lang}-[a-z]{2,3}:section-[1-6]$`)),
    /** Learner-facing section title (native language); the first unit of a section that carries one sets it. */
    sectionTitle: z.string().min(1).optional(),
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().max(120),
    guidebook: z.string().min(600).max(2200),
    words: z.array(WordSchema).min(1),
    lessons: z
      .array(z.strictObject({ id: z.string().min(1), title: z.string().min(1), objectives: z.array(z.string().min(1)).min(1) }))
      .min(1),
  });

/** A draft lesson (lessons step): exercises for one stub lesson of the draft pack. */
export const draftLessonSchema = () =>
  z.strictObject({
    lessonId: z.string().min(1),
    exercises: z.array(ExerciseSchema).min(1),
    flow: z.array(z.union([z.strictObject({ concept: z.string().min(1) }), z.strictObject({ exercise: z.string().min(1) })])).optional(),
  });

/**
 * A lexicon addition (lexicon-add step, P3d): an A1 word the frequency-based
 * selection left out (subject pronouns, sí/no, question words, numbers,
 * colours, weekdays, everyday nouns and verbs). Evidence (IPA, frequency,
 * kaikki reference) comes from the committed candidate pool when the
 * lemma|poolPos reading exists there; the examples are original A1
 * sentences of this project. Ids are new and never reuse a frozen one.
 */
export const lexiconAddSchema = (lang: string) =>
  z.strictObject({
    lemma: z.string().min(1),
    partOfSpeech: z.enum(POS_VALUES),
    /** The pool reading that carries the evidence (default: partOfSpeech). */
    poolPos: z.enum(POS_VALUES).optional(),
    /** Display surface; nouns default to article + lemma from the gender. */
    surface: z.string().min(1).optional(),
    gender: z.enum(["masculine", "feminine", "neuter", "both"]).optional(),
    glossEn: z.string().min(1),
    glossVi: z.string().min(1).refine((s) => !/^TODO:/.test(s), "no draft marker"),
    topic: z.string().min(1),
    examples: z.array(z.strictObject({ target: z.string().min(1), en: z.string().min(1), vi: z.string().min(1) })).min(1).max(3),
    note: z.string().optional(),
  }).superRefine((r, ctx) => {
    if (r.partOfSpeech === "noun" && r.gender === undefined) ctx.addIssue({ code: "custom", message: `${lang}: a noun needs its gender` });
  });

/** A lexicon review record: the Vietnamese fields of one lexeme (lexicon-review step). */
export const lexiconReviewSchema = (lang: string) =>
  z.strictObject({
    id: z.string().regex(new RegExp(`^${lang}:w:[a-z0-9-]+$`)),
    glossVi: z.string().min(1).refine((s) => !/^TODO:/.test(s), "no draft marker"),
    exampleTranslationsVi: z.array(z.string().min(1).refine((s) => !/^TODO:/.test(s), "no draft marker")),
    confusables: z.array(z.string().regex(new RegExp(`^${lang}:w:[a-z0-9-]+$`))).optional(),
    /** Indices (into the current examples) of examples unfit for learners — vulgar, wrong sense, word absent, idiom far beyond A1. Translations then cover the kept examples in order; at least one example must remain. */
    dropExamples: z.array(z.number().int().min(0)).optional(),
    /** Original examples (this project, registry source `original-lexicon-etl`) appended after the drops — for lexemes whose ETL examples do not show the word (lemmatisation errors). Not covered by exampleTranslationsVi. */
    addExamples: z.array(z.strictObject({ target: z.string().min(1), en: z.string().min(1), vi: z.string().min(1) })).optional(),
    /** Correct an ETL part-of-speech error (e.g. an adjective tagged as noun). */
    partOfSpeech: z.enum(POS_VALUES).optional(),
    note: z.string().optional(),
  });

export type StepDef = {
  id: StepId;
  /** Vietnamese task statement for the prompt. */
  task: string;
  /** The per-record schema OUTPUT.jsonl lines must satisfy. */
  recordSchema(lang: string, native: string): z.ZodTypeAny;
  /** Where ingested records land (repo-relative). */
  target(lang: string, courseId: string): string;
  /** Validator error prefixes that judge this step. */
  validatorPrefixes: string[];
  /** Blueprint section headings to slice into the prompt. */
  blueprintSections: string[];
  /** French exemplar picker: the committed French records that carry `vi` text. */
  exemplars(): unknown[];
  /** Sessions a full course typically needs for this step. */
  sessions: string;
};

function pick<T>(list: T[], n: number): T[] {
  if (list.length <= n) return list;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor((i * list.length) / n)]);
  return out;
}
function frDoc<T>(rel: string, key: string): T[] {
  if (!existsSync(safeResolve(rel))) return [];
  return ((readJson(rel) as Record<string, unknown>)[key] as T[]) ?? [];
}
function frPack(): PackSource | null {
  const rel = "content/courses/fr-vi.json";
  return existsSync(safeResolve(rel)) ? (readJson(rel) as PackSource) : null;
}

export const STEPS: Record<StepId, StepDef> = {
  objectives: {
    id: "objectives",
    task: "Soạn danh sách mục tiêu học tập (objectives) cho khoá học: khoảng 34 mục tiêu theo 9 nhóm (grammar, lexical, written_production, written_reception, spoken_reception, spoken_production, interaction, phonology, strategy), ~23 mục tiêu `essential`, mỗi mục tiêu có title và canDo bằng tiếng Việt, prerequisites, cefrAlignments (level, scaleName, relation direct|supports, sourceRef `cefr-cv-2020:<scale-slug>`), evidenceNote cho mọi alignment `direct`. Không bao giờ chép câu mô tả CEFR.",
    recordSchema: (lang) => courseObjectiveSchema(lang),
    target: (lang) => `content/${lang}/assessment/objectives.json`,
    validatorPrefixes: ["objectives", "assessment", "claim", "attainment"],
    blueprintSections: ["## 8. Assessment"],
    exemplars: () => pick(frDoc("content/fr/assessment/objectives.json", "objectives"), 3),
    sessions: "1",
  },
  units: {
    id: "units",
    task: "Lập kế hoạch các đơn vị (unit) của Phần 1–6 (sections 1–6; Phần 1 soạn mới, 5 unit): mỗi record là một unit với id `<courseId>:unit-<chữ>`, title, description (≤ 90 ký tự), guidebook markdown tiếng Việt 600–2 000 ký tự (## tiêu đề, gạch đầu dòng, ví dụ ngôn ngữ đích in nghiêng), words (surface từ danh sách lexeme cho phép + gloss `native` tiếng Việt y hệt lexicon), và 4 lesson stubs {id `<courseId>:u<chữ>-l<n>`, title, objectives}. Không viết bài tập ở bước này.",
    recordSchema: (lang) => draftUnitSchema(lang),
    target: (lang) => `content/${lang}/_drafts/pack.json`,
    validatorPrefixes: ["pack", "course"],
    blueprintSections: ["## 1. Course pack"],
    exemplars: () => {
      const p = frPack();
      if (!p) return [];
      return pick(
        p.sections.slice(1, 3).flatMap((s) => s.units.map((u) => ({ sectionId: s.id, id: u.id, title: u.title, description: u.description, guidebook: u.guidebook, words: u.words.slice(0, 4), lessons: u.lessons.map((l) => ({ id: l.id, title: l.title, objectives: l.objectives ?? [] })) }))),
        2
      );
    },
    sessions: "1",
  },
  lessons: {
    id: "lessons",
    task: "Viết bài tập cho từng lesson stub của gói nháp (_drafts/pack.json): mỗi record {lessonId, exercises[], flow?}. Mỗi lesson Phần 2: 8–11 bài tập (select, fillBlank, typeAnswer, articleSelect/conjugationCloze nếu plugin cho phép); Phần 3: 5–6 (listeningComprehension/readingComprehension tham chiếu clip/reading id cho phép, select, match, dictation); Phần 4: speakProduction/speakRepetition (tham chiếu speech item id); Phần 5: guidedWriting/simpleForm (tham chiếu writing task id); Phần 6: interactionScenario (tham chiếu scenario id) + select/wordBank. Prompt/options chỉ dùng surface hoặc gloss của lexeme cho phép; đáp án đúng phải phân bố đều các vị trí.",
    recordSchema: () => draftLessonSchema(),
    target: (lang, courseId) => `content/courses/${courseId}.json`,
    validatorPrefixes: ["pack", "course", "exercise", "flows", "pedagogy"],
    blueprintSections: ["## 1. Course pack"],
    exemplars: () => {
      const p = frPack();
      if (!p) return [];
      const lessons = p.sections.slice(1).flatMap((s) => s.units.flatMap((u) => u.lessons));
      return pick(lessons, 3).map((l) => ({ lessonId: l.id, exercises: l.exercises.slice(0, 4), flow: l.flow?.slice(0, 4) }));
    },
    sessions: "3–4 (một phiên mỗi phần)",
  },
  concepts: {
    id: "concepts",
    task: "Viết các thẻ khái niệm (concept) tiếng Việt cho Phần 2 (17–20 thẻ theo brief §3) và các bảng chia động từ (paradigm): record là một concept (title, shortRule, explanation, examples{target, translations.vi, note.vi}, exceptions, memoryHint, objectives, sourceRefs) HOẶC {paradigm: {lemma, gloss.vi, group, cells, evidence}}. Mọi ô chia phải có trong morphology.json; mọi số liệu trỏ tới derived/*.json; 'luôn luôn' chỉ khi ≥ 99,5 %.",
    recordSchema: (lang) => z.union([conceptSchema(lang), z.strictObject({ paradigm: paradigmTableSchema(buildPlugin(lang).paradigm?.cellIds ?? ["inf"]) })]),
    target: (lang) => `content/${lang}/pedagogy/concepts.json`,
    validatorPrefixes: ["pedagogy", "paradigms", "concept"],
    blueprintSections: ["## 3. Pedagogy"],
    exemplars: () => [...pick(frDoc("content/fr/pedagogy/concepts.json", "concepts"), 2), ...pick(frDoc("content/fr/pedagogy/paradigms.json", "tables"), 1).map((t) => ({ paradigm: t }))],
    sessions: "1–2",
  },
  readings: {
    id: "readings",
    task: "Viết 19 bài đọc ngắn (message, notice, description, dialogue, narrative) 13–30 token bằng ngôn ngữ đích cho Phần 3: id `<lang>.read.<slug>`, kind, title, blocks, objectiveRefs, lexemeRefs (chỉ id cho phép), supportGlossary (gloss tiếng Việt). Giới hạn token theo unit trong blueprint.",
    recordSchema: (lang) => readingSourceSchema(lang),
    target: (lang) => `content/${lang}/reception/reading.json`,
    validatorPrefixes: ["reception", "reading"],
    blueprintSections: ["## 4. Reception"],
    exemplars: () => pick(frDoc("content/fr/reception/reading.json", "readings"), 3),
    sessions: "1",
  },
  stories: {
    id: "stories",
    task: "Viết truyện ngắn phân cấp (P5b) bằng ngôn ngữ đích: id `<lang>.story.<slug>`, band (A1-1 … A2-2), title, blurb.vi/en, 8–60 câu {speaker N|A|B, text, translation.vi/en}, newLexemes (3–5 id cho phép), questions (3: locate/infer, prompt + 3–4 options.vi/en, answer). 150–400 token; mọi token phải là lexeme cho phép (kể cả dạng chia), function word, tên riêng khai báo trong tokenMap, hoặc số; ≥ 95 % token đã biết ở band của truyện (từ mới ≤ 5 %). In vốn từ theo band: `bun scripts/stories.ts bands --lang <code>`; chấm truyện: `bun scripts/stories.ts check --lang <code>`. Không ghi nhãn CEFR (A1, B1 …) trong chữ hiển thị.",
    recordSchema: (lang) => storySourceSchema(lang),
    target: (lang) => `content/${lang}/stories/stories.json`,
    validatorPrefixes: ["stories"],
    blueprintSections: ["## 4. Reception"],
    exemplars: () => pick(frDoc("content/fr/stories/stories.json", "stories"), 2),
    sessions: "2–3 (10 stories each)",
  },
  listening: {
    id: "listening",
    task: "Viết kịch bản các clip nghe: id `<lang>.clip.<slug>`, kind (word_phrase, message, announcement, instruction, factual, dialogue), segments{speaker A|B, text} (≤ ~12 s, 1–3 đơn vị thông tin), objectiveRefs, lexemeRefs, sourceRef `original-project`, authoringSpec{informationUnits, inferenceDemand}, scoredPlaybackPolicy{maxPlays 2, rate 1}. Bao gồm clip dạy (Phần 3), clip mẫu cho speech, dòng thoại đối tác cho scenarios (ix_*), checkpoint và placement.",
    recordSchema: (lang) => listeningClipSchema(lang),
    target: (lang) => `content/${lang}/reception/listening.json`,
    validatorPrefixes: ["reception", "listening", "clip"],
    blueprintSections: ["## 4. Reception"],
    exemplars: () => pick(frDoc("content/fr/reception/listening.json", "clips"), 3),
    sessions: "2 (clip dạy; dòng thoại đối tác sau scenarios)",
  },
  speech: {
    id: "speech",
    task: "Viết 50 mục luyện nói: taskFamily (formulaic_exchange, self_introduction, information_giving, description), elicitationType, prompt.instruction.vi (+ cueFacts), target, acceptedVariants, objectiveRefs, lexemeRefs, evidenceLexemeRefs, assistancePolicy, scoredEligibility, modelAudioRef (clip id) cho repetition, reserved cho checkpoint.",
    recordSchema: (lang) => speechItemSchema(lang),
    target: (lang) => `content/${lang}/speech/items.json`,
    validatorPrefixes: ["speech"],
    blueprintSections: ["## 5. Speech"],
    exemplars: () => pick(frDoc("content/fr/speech/items.json", "items"), 3),
    sessions: "1",
  },
  writing: {
    id: "writing",
    task: "Viết 34 nhiệm vụ viết: taskFamily (short_message, personal_profile, simple_description, simple_form), mode guided|open, instruction.vi, cueFacts (label.vi + value), rubric (requiredSlots với description.vi + variants, length window, plausibility), formFields chỉ cho simple_form, reserved cho checkpoint. Không để lộ đáp án trong cueFacts.",
    recordSchema: (lang) => writingTaskSchema(lang),
    target: (lang) => `content/${lang}/writing/tasks.json`,
    validatorPrefixes: ["writing"],
    blueprintSections: ["## 6. Writing"],
    exemplars: () => pick(frDoc("content/fr/writing/tasks.json", "tasks"), 3),
    sessions: "1",
  },
  scenarios: {
    id: "scenarios",
    task: "Viết 18 kịch bản hội thoại (conversation, transaction, information_exchange): title.vi, goal.vi, objectiveRefs, startNodeId, nodes (partner: text + clipId + rephraseText/rephraseClipId; learner: prompt.vi, intents với patterns/next, noMatchNext → nút sửa chữa; terminal: outcome goal_met|goal_not_met + clipId). ≥ 2 lượt người học; đồ thị không ngõ cụt; mọi clipId phải tồn tại trong listening.json.",
    recordSchema: (lang) => interactionScenarioSchema(lang),
    target: (lang) => `content/${lang}/interaction/scenarios.json`,
    validatorPrefixes: ["interaction", "scenario"],
    blueprintSections: ["## 7. Interaction"],
    exemplars: () => pick(frDoc("content/fr/interaction/scenarios.json", "scenarios"), 2),
    sessions: "2",
  },
  checkpoints: {
    id: "checkpoints",
    task: "Viết 7 checkpoint (section-1 … section-6 và a1-capstone): id, checkpointVersion 1, formVersion 1, sectionId, title.vi, description.vi, items (id `<lang>.cpi.<slug>`, itemVersion, exercise theo loại của blueprint, objectiveTargets, essential), criteria, forms (capstone: 2 form song song). Bài tập chỉ tham chiếu id cho phép; exerciseNativeCode = vi.",
    recordSchema: (lang) => checkpointSchema(lang),
    target: (lang) => `content/${lang}/assessment/checkpoints.json`,
    validatorPrefixes: ["checkpoints", "checkpoint", "assessment", "claim"],
    blueprintSections: ["## 8. Assessment"],
    exemplars: () => pick(frDoc("content/fr/assessment/checkpoints.json", "checkpoints"), 2).map((c) => ({ ...(c as Record<string, unknown>), items: ((c as { items: unknown[] }).items ?? []).slice(0, 3) })),
    sessions: "2",
  },
  placement: {
    id: "placement",
    task: "Viết bài kiểm tra xếp lớp: 4 stage (id `<lang>.pstage.<slug>`, title.vi, clusters {id `<lang>.pcluster.<slug>`, objectiveId, anchorLessonId (lesson id của khoá, tăng dần nghiêm ngặt), items {id `<lang>.pli.<slug>`, itemVersion, exercise, objectiveTargets}}); tổng ≤ 28 item; allComfortableLessonId.",
    recordSchema: (lang) => placementStageSchema(lang),
    target: (lang) => `content/${lang}/assessment/placement.json`,
    validatorPrefixes: ["placement", "assessment"],
    blueprintSections: ["## 8. Assessment"],
    exemplars: () => pick(frDoc("content/fr/assessment/placement.json", "stages"), 1).map((s) => ({ ...(s as Record<string, unknown>), clusters: ((s as { clusters: unknown[] }).clusters ?? []).slice(0, 2) })),
    sessions: "1",
  },
  exam: {
    id: "exam",
    task: "Viết lộ trình thi (exam track) theo ĐỊNH DẠNG CÔNG KHAI của kỳ thi trong brief — không bao giờ chép đề thật: một bản ghi {id `<lang>.exam.<slug>`, trackVersion, name, level, title, description, formatSource {publisher, reference, checkedAgainstOfficialGuide, note}, sections [{id, skill reading|listening|writing|speaking, title, minutes, preparationMinutes?, maxPoints, tasks [{id, title, instruction, format mcq3|matching|form|short_text|monologue|conversation, itemsPerForm}]}], groups [{id, title, sectionIds, maxPoints, passPoints}], readiness {bands (giảm dần, band cuối minGroupShare 0; nhãn có chữ \"ước tính\"), incomplete, disclaimer}, items [{id `<lang>.exi.<track>.<slug>`, itemVersion, sectionId, taskId, exercise, objectiveTargets}], forms ≥ 2, rời nhau, mỗi form đủ itemsPerForm cho từng task}. Bài đọc/clip/speech/writing/scenario của đề là mục RIÊNG (speech/writing/scenario reserved: true), soạn ở các bước tương ứng trước. Không bao giờ viết \"sẽ đỗ\" hay hứa kết quả.",
    recordSchema: (lang) => examTrackSchema(lang).omit({ version: true, language: true, exerciseNativeCode: true }),
    target: (lang) => `content/${lang}/exam/<track>.json`,
    validatorPrefixes: ["exam", "speech", "writing", "interaction", "reception"],
    blueprintSections: ["## 8. Assessment"],
    exemplars: () => [],
    sessions: "1–2",
  },
  "lexicon-review": {
    id: "lexicon-review",
    task: "Xem lại từ điển: với mỗi lexeme trong INPUT.json (những mục còn `TODO:vi`, gloss bắc cầu qua tiếng Anh, hoặc confusables tự sinh), trả về glossVi (gloss tiếng Việt ngắn, đúng từ loại), exampleTranslationsVi (bản dịch tiếng Việt cho từng ví dụ, theo thứ tự), confusables (id cho phép, tuỳ chọn), note. Không đổi id; không dịch câu ví dụ sang ngôn ngữ khác.",
    recordSchema: (lang) => lexiconReviewSchema(lang),
    target: (lang) => `content/${lang}/lexicon/lexemes.json`,
    validatorPrefixes: ["lexicon"],
    blueprintSections: ["## 2. Lexicon"],
    exemplars: () =>
      pick(frDoc<{ id: string; glosses: Record<string, string>; examples: { translations: Record<string, string> }[]; relations?: { confusables?: string[] } }>("content/fr/lexicon/lexemes.json", "lexemes"), 2).map((l) => ({ id: l.id, glossVi: l.glosses.vi, exampleTranslationsVi: l.examples.map((e) => e.translations.vi), confusables: l.relations?.confusables })),
    sessions: "2–3 (≈ 300 lexeme mỗi phiên)",
  },
  "lexicon-add": {
    id: "lexicon-add",
    task: "Bổ sung từ A1 còn thiếu trong từ điển (đại từ nhân xưng, sí/no, từ để hỏi, số đếm, màu sắc, các ngày trong tuần, danh từ và động từ thông dụng): mỗi record là một lexeme mới với lemma, partOfSpeech (poolPos nếu bằng chứng trong pool mang từ loại khác), giống (danh từ), glossEn, glossVi, topic và 1–3 câu ví dụ A1 tự soạn {target, en, vi}. Không trùng surface đã có; id do công cụ cấp và không bao giờ tái sử dụng id đã đóng băng.",
    recordSchema: (lang) => lexiconAddSchema(lang),
    target: (lang) => `content/${lang}/lexicon/lexemes.json`,
    validatorPrefixes: ["lexicon"],
    blueprintSections: ["## 2. Lexicon"],
    exemplars: () =>
      pick(frDoc<{ lemma: string; partOfSpeech: string; gender?: string; glosses: Record<string, string>; topic: string; examples: { target: string; translations: Record<string, string> }[] }>("content/fr/lexicon/lexemes.json", "lexemes"), 2).map((l) => ({ lemma: l.lemma, partOfSpeech: l.partOfSpeech, gender: l.gender, glossEn: l.glosses.en, glossVi: l.glosses.vi, topic: l.topic, examples: l.examples.map((e) => ({ target: e.target, en: e.translations.en, vi: e.translations.vi })) })),
    sessions: "1",
  },
};

export function stepDef(id: string): StepDef {
  const def = (STEPS as Record<string, StepDef>)[id];
  if (!def) throw new Error(`unknown authoring step "${id}" (${STEP_IDS.join(", ")})`);
  return def;
}
