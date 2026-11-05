/**
 * QC 2026-11-05 §1.2: negation-aware keyword matching for every course. A
 * required concept (speech, interaction intents) or writing slot that sits
 * inside a negated span does not count — 不是 is not 是, "I don't like
 * coffee" is not "like". The spans are the plugins' data
 * (LanguageRules.negation); a form that itself contains a negator is exempt,
 * so a key that asks for the negation still passes.
 */
import { describe, expect, test } from "bun:test";

import { matchIntent, type ExpectedIntent, type LearnerNode } from "../interaction/machine";
import { languageRules, languageRulesForCourse, type CourseLexicon, type LanguageRules } from "../languages";
import { zh } from "../languages/zh";
import { gradeSpokenAttempt } from "../speech/grader";
import { evaluateGuidedWriting, evaluateSimpleForm, normalizeWritten } from "../writing/rubric";
import { ZH_LEXICON } from "./zh-course-lexicon";

const zhL = zh.withLexicon!(ZH_LEXICON);

/** Concept-only spoken grading (no whole-utterance variant can rescue the answer). */
function concepts(rules: LanguageRules, heard: string, slots: string[][]): boolean {
  return gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: [], requiredConcepts: slots }, rules).correct;
}

/** Guided writing with one required slot: whether that slot is realized. */
function slotRealized(rules: LanguageRules, text: string, variants: string[], cueProvided = false): boolean {
  const known = new Set(normalizeWritten(text, rules).split(" "));
  const evaluation = evaluateGuidedWriting({
    rules,
    targetLanguage: "target",
    text,
    rubric: { requiredSlots: [{ id: "s", description: "slot", variants, cueProvided }], minTokens: 1, maxTokens: 60 },
    promptText: "",
    knownVocabulary: known,
  });
  return evaluation.matchedSlotIds.includes("s");
}

type Case = [heard: string, slots: string[][]];

function languageSuite(name: string, rules: () => LanguageRules, negative: Case[], positive: Case[]) {
  describe(`negation — ${name}`, () => {
    test.each(negative)("negated keyword does not count: %p", (heard, slots) => {
      expect(concepts(rules(), heard, slots)).toBe(false);
    });
    test.each(positive)("affirmative (or required-negation) answer still counts: %p", (heard, slots) => {
      expect(concepts(rules(), heard, slots)).toBe(true);
    });
  });
}

languageSuite(
  "zh",
  () => zhL,
  [
    ["不是，我以前来过", [["第一", "是", "对"]]],
    ["不对", [["第一", "是", "对"]]],
    ["我不是第一次来", [["第一次", "第一"]]],
    ["不能", [["可以", "能", "没问题", "好的"]]],
    ["不可以", [["可以", "能", "没问题", "好的"]]],
    ["我明天不能上夜班", [["可以", "能", "没问题", "好的"]]],
    ["不好", [["这儿", "这里", "可以", "好", "好的"]]],
    ["我不想去火车站", [["火车站"]]],
    ["我没有发烧", [["发烧"]]],
    ["别去火车站", [["火车站"]]],
  ],
  [
    ["是，第一次", [["第一", "是", "对"]]],
    ["对，我第一次来", [["第一", "是", "对"]]],
    ["可以，没问题", [["可以", "能", "没问题", "好的"]]],
    ["没问题", [["可以", "能", "没问题", "好的"]]],
    ["好的，在这儿停", [["这儿", "这里", "可以", "好", "好的"]]],
    ["我去火车站", [["火车站"]]],
    // Required AS a negation: the negated form is what the key asks for.
    ["我不发烧", [["不", "没", "没有"]]],
    ["不是", [["不是"]]],
    ["我没有发烧", [["没发烧", "没有发烧", "不发烧"]]],
    // A negator inside an idiom negates nothing.
    ["对不起可以再说一遍吗", [["可以"]]],
    ["没关系可以", [["可以"]]],
    // A clause boundary ends the span: "No — I am going to the station".
    ["不，我去火车站", [["火车站"]]],
  ]
);

languageSuite(
  "zh (no course lexicon: segmenter fallback)",
  () => zh,
  [
    ["我不是第一次来", [["第一次", "第一"]]],
    ["不可以", [["可以"]]],
    ["我很不舒服", [["舒服"]]],
  ],
  [
    ["是，第一次", [["第一次", "第一"]]],
    ["可以", [["可以"]]],
  ]
);

languageSuite(
  "ja",
  () => languageRulesForCourse("ja-vi"),
  [
    ["明日は行きません", [["行き"]]],
    ["行きませんでした", [["行き"]]],
    ["行きません", [["行きます"]]],
    ["好きじゃないです", [["好き"]]],
    ["学生ではありません", [["学生"]]],
    ["時間がない", [["時間"]]],
  ],
  [
    ["明日行きます", [["行き"]]],
    ["行きます", [["行きます"]]],
    ["好きです", [["好き"]]],
    ["学生です", [["学生"]]],
    ["行きません", [["ません"]]],
  ]
);

/** Course words split by morpheme, as a ko course lexicon binds them (maximal match, spacing-insensitive). */
const KO_LEXICON: CourseLexicon = {
  entries: ["학교", "에", "가요", "가", "지", "않아요", "좋아", "하", "해요", "학생", "이", "저", "는", "아니에요", "안녕하세요", "안", "못", "불안", "커피"].map((surface) => ({ surface })),
};

languageSuite(
  "ko (course lexicon)",
  () => languageRules("ko").withLexicon!(KO_LEXICON),
  [
    ["안 가요", [["가요"]]],
    ["못 가요", [["가요"]]],
    ["가지 않아요", [["가"]]],
    ["좋아하지 않아요", [["좋아"]]],
    ["저는 학생이 아니에요", [["학생"]]],
  ],
  [
    ["학교에 가요", [["가요"]]],
    ["좋아해요", [["좋아"]]],
    ["안녕하세요", [["안녕하세요"]]],
    ["저는 학생이에요", [["학생"]]],
    ["안 가요", [["안"]]],
  ]
);

languageSuite(
  "ko (no course lexicon: eojeol)",
  () => languageRules("ko"),
  [
    ["안 가요", [["가요"]]],
    ["못 가요", [["가요"]]],
    ["오늘은 학교에 안 가요", [["가요"]]],
  ],
  [
    ["학교에 가요", [["가요"]]],
    ["안녕하세요", [["안녕하세요"]]],
  ]
);

languageSuite(
  "fr",
  () => languageRules("fr"),
  [
    ["Je n'aime pas le café", [["aime"]]],
    ["je ne veux pas de café", [["café"]]],
    ["je ne vais jamais au cinéma", [["vais"]]],
    ["je ne parle plus anglais", [["parle"]]],
    ["j'aime pas le café", [["aime"]]],
  ],
  [
    ["j'aime le café", [["aime"]]],
    ["le restaurant n'est pas ouvert", [["restaurant"]]],
    ["je n'aime pas le thé mais je veux un café", [["café"]]],
    ["ça va pas mal", [["ça va"]]],
    ["je ne sais pas", [["ne sais pas", "sais pas"]]],
  ]
);

languageSuite(
  "de",
  () => languageRules("de"),
  [
    ["ich komme heute nicht", [["komme"]]],
    ["ich habe keine Zeit", [["zeit"]]],
    ["ich trinke keinen Kaffee", [["kaffee"]]],
    ["das ist nicht gut", [["gut"]]],
  ],
  [
    ["ich trinke Kaffee", [["kaffee"]]],
    ["ich trinke nicht Kaffee sondern Tee", [["tee"]]],
    ["kein Problem ich komme", [["komme"]]],
    ["das ist nicht gut", [["nicht gut"]]],
  ]
);

languageSuite(
  "es",
  () => languageRules("es"),
  [
    ["no quiero café", [["quiero"]]],
    ["yo no tengo hermanos", [["tengo"]]],
    ["no soy de Madrid", [["madrid"]]],
  ],
  [
    ["quiero un café", [["quiero"]]],
    ["No, soy de Madrid.", [["madrid"]]],
    ["no hay problema, vale", [["vale"]]],
    ["no, gracias", [["no"]]],
  ]
);

languageSuite(
  "it",
  () => languageRules("it"),
  [
    ["non voglio un caffè", [["voglio"]]],
    ["non ho fratelli", [["ho"]]],
    ["non parlo inglese", [["inglese"]]],
  ],
  [
    ["voglio un caffè", [["voglio"]]],
    ["non parlo inglese ma parlo italiano", [["italiano"]]],
    ["non lo so", [["non lo so"]]],
  ]
);

languageSuite(
  "pt",
  () => languageRules("pt"),
  [
    ["não quero café", [["quero"]]],
    ["eu não tenho irmãos", [["tenho"]]],
    ["não gosto de chá", [["gosto"]]],
  ],
  [
    ["quero um café", [["quero"]]],
    ["não gosto de chá mas gosto de café", [["café"]]],
    ["não tem problema eu vou", [["vou"]]],
    ["não, obrigado", [["não"]]],
  ]
);

languageSuite(
  "en",
  () => languageRules("en"),
  [
    ["I don't like coffee", [["like"]]],
    ["I'm not hungry", [["hungry"]]],
    ["I can't come tomorrow", [["come"]]],
    ["I have no money", [["money"]]],
    ["I never drink tea", [["drink"]]],
    ["I can't", [["I can", "yes"]]],
  ],
  [
    ["I like coffee", [["like"]]],
    // The subject before the negator, and a clause after a conjunction, are not negated (shipped en model answers).
    ["the printer does not work", [["printer"]]],
    ["I can't come today because I am sick", [["sick"]]],
    ["I can't come tomorrow but I can come on Friday", [["friday"]]],
    ["no problem I can come", [["come"]]],
    ["I'm not hungry", [["not hungry"]]],
    ["I don't know", [["don't know", "do not know"]]],
    // The item asks for the negation in another slot: its other slots are not negation-checked.
    ["I don't like coffee", [["do not"], ["coffee"]]],
  ]
);

describe("negation — an item whose expected answer is itself negated", () => {
  test("a negated accepted variant makes the negation required for the concept slots", () => {
    const rules = languageRules("en");
    const spec = (variants: string[]) => ({ acceptedVariants: variants, requiredConcepts: [["coffee"]] });
    const heard = { finalTranscript: "I really don't want any coffee", alternatives: [] };
    expect(gradeSpokenAttempt(heard, spec(["I don't want coffee"]), rules).correct).toBe(true);
    expect(gradeSpokenAttempt(heard, spec(["I want coffee"]), rules).correct).toBe(false);
  });
});

describe("negation — the writing rubric's slots", () => {
  test.each([
    ["fr", "Je n'aime pas le café.", ["j'aime", "aime"], false],
    ["fr", "J'aime le café.", ["j'aime", "aime"], true],
    ["en", "I don't like tea.", ["like"], false],
    ["en", "I like tea. I don't like coffee.", ["like tea"], true],
    ["de", "Ich habe keine Zeit.", ["zeit"], false],
    ["es", "No tengo hermanos.", ["tengo"], false],
    ["es", "No tengo hermanos.", ["no tengo"], true],
  ] as const)("%s %p", (code, text, variants, realized) => {
    expect(slotRealized(languageRules(code), text, [...variants])).toBe(realized);
  });

  test("a cue-provided fact (a day handed to the learner) is mentioned whatever its clause's polarity", () => {
    const en = languageRules("en");
    expect(slotRealized(en, "Dear Ms. Smith, I can't come on Thursday.", ["thursday"], true)).toBe(true);
    expect(slotRealized(en, "Dear Ms. Smith, I can't come on Thursday.", ["thursday"], false)).toBe(false);
  });

  test("zh: 我不是学生 does not realize 是", () => {
    expect(slotRealized(zhL, "我不是学生。", ["是"])).toBe(false);
    expect(slotRealized(zhL, "我是学生。", ["是"])).toBe(true);
    expect(slotRealized(zhL, "我不是学生。", ["不是"])).toBe(true);
  });

  test("simple form: a negated field value does not fill the slot", () => {
    const rules = languageRules("en");
    const form = (value: string) =>
      evaluateSimpleForm({
        rules,
        targetLanguage: "English",
        values: { f: value },
        fields: [{ id: "f", label: "Drink", slotId: "s" }],
        rubric: { requiredSlots: [{ id: "s", description: "a drink", variants: ["coffee"], cueProvided: false }], minTokens: 1, maxTokens: 10 },
      }).verdict;
    expect(form("coffee")).toBe("meets_rubric");
    expect(form("no coffee")).toBe("does_not_meet_rubric");
  });
});

/** The four zh-vi scenario turns of the D-10 answer findings (content/zh/_drafts/review/findings-answers.json). */
describe("negation — zh-vi scenarios from the D-10 findings", () => {
  const node = (expected: ExpectedIntent[]): LearnerNode => ({ kind: "learner", id: "l", prompt: "", expected, noMatchNext: "r", scored: true });
  const intentOf = (n: LearnerNode, heard: string) => matchIntent(n, { finalTranscript: heard, alternatives: [] }, zhL)?.intent ?? null;

  const clinicReception = node([
    { intent: "first", acceptedVariants: ["是，第一次", "对，第一次", "是的，我第一次来", "对", "是"], requiredConcepts: [["第一", "是", "对"]], next: "p1" },
  ]);
  const shiftChange = node([
    { intent: "accept", acceptedVariants: ["可以", "能", "可以，没问题", "没问题", "好的", "能上"], requiredConcepts: [["可以", "能", "没问题", "好的"]], next: "p1" },
  ]);
  const taxi = node([
    {
      intent: "stop",
      acceptedVariants: ["好，在这儿停", "好，在这里停", "对，在这儿停", "对，在这里停", "可以", "好的，就在这儿停", "好的，就在这里停", "在这儿停吧", "在这里停吧", "对，就在这儿", "对，就在这里"],
      requiredConcepts: [["这儿", "这里", "可以", "好", "好的"]],
      next: "t_ok",
    },
  ]);
  const coughAsAuthored = node([
    { intent: "no_fever", acceptedVariants: ["不发烧", "我不发烧", "没有发烧", "没发烧", "没有"], requiredConcepts: [["不", "没", "没有"]], next: "t_ok" },
  ]);
  // The reviewer's fix for cp6_clinic_cough l1: a bare negator concept accepts any negated sentence.
  const coughFixed = node([
    { intent: "no_fever", acceptedVariants: ["不发烧", "我不发烧", "没有发烧", "没发烧", "没有"], requiredConcepts: [["不发烧", "没发烧", "没有发烧", "没有"]], next: "t_ok" },
  ]);

  test("clinic_reception l0: 不是 / 不对 / 不是第一次 are not 'first visit'", () => {
    expect(intentOf(clinicReception, "不是，我以前来过")).toBeNull();
    expect(intentOf(clinicReception, "不对，我来过")).toBeNull();
    expect(intentOf(clinicReception, "我不是第一次来")).toBeNull();
    expect(intentOf(clinicReception, "是，我第一次来这儿")).toBe("first");
    expect(intentOf(clinicReception, "对，第一次")).toBe("first");
  });

  test("a1cap_shift_change l0: 不能 / 不可以 are not acceptance; 没问题 is", () => {
    expect(intentOf(shiftChange, "不能")).toBeNull();
    expect(intentOf(shiftChange, "我不可以")).toBeNull();
    expect(intentOf(shiftChange, "明天我不能上夜班")).toBeNull();
    expect(intentOf(shiftChange, "没问题")).toBe("accept");
    expect(intentOf(shiftChange, "可以，我明天能上夜班")).toBe("accept");
  });

  test("taxi l1: 不好 is not 'yes, stop here'", () => {
    expect(intentOf(taxi, "不好")).toBeNull();
    expect(intentOf(taxi, "不可以")).toBeNull();
    expect(intentOf(taxi, "好的，就在这儿停")).toBe("stop");
    expect(intentOf(taxi, "可以，在这儿")).toBe("stop");
  });

  test("cp6_clinic_cough l1: the bare-negator concept is a content fix; with it, 我很不舒服 is not 'no fever'", () => {
    // As authored, the concept IS a negator, so the engine cannot tell 我很不舒服 from 我不发烧 (content finding stands).
    expect(intentOf(coughAsAuthored, "我很不舒服")).toBe("no_fever");
    expect(intentOf(coughFixed, "我很不舒服")).toBeNull();
    expect(intentOf(coughFixed, "我不发烧")).toBe("no_fever");
    expect(intentOf(coughFixed, "我没有发烧")).toBe("no_fever");
    expect(intentOf(coughFixed, "医生，我没发烧")).toBe("no_fever");
  });
});

describe("negation — every plugin with a target course declares its spans", () => {
  test.each(["zh", "ja", "ko", "fr", "de", "es", "it", "pt", "en"])("%s", (code) => {
    expect(languageRules(code).negation).toBeDefined();
  });
});
