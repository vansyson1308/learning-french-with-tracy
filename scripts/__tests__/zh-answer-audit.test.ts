/**
 * Independent D-10 audit of zh-vi (content/zh/_drafts/review/findings-audit.json, 2026-11-05; decisions in
 * decisions-audit.json): the auditor's P1 (我特别喜欢唱歌 rejected while 很 / 非常 were accepted) became one generator
 * rule, zh_text.tebie_spellings — 很 / 非常 before a verb or an adjective also take 特别, never after 比 and never
 * 很多 / 很少 before a noun — and the cheap P2s were applied. The answers run through the app's own graders over the
 * course content, as in zh-answer-pass2.test.ts. Content is read from the staged layer while it exists, else content/.
 */
import { existsSync } from "fs";

import { describe, expect, test } from "bun:test";

import { matchIntent, type LearnerNode } from "../../src/lib/interaction/machine";
import { zh } from "../../src/lib/languages/zh";
import { gradeSpokenAttempt } from "../../src/lib/speech/grader";
import { evaluateGuidedWriting, type WritingRubric } from "../../src/lib/writing/rubric";
import { ZH_LEXICON } from "../../src/lib/__tests__/zh-course-lexicon";
import { readJson, safeResolve } from "../lib/pipeline";

const load = <T>(rel: string): T => {
  const path = [`content/zh/_drafts/staged/content/${rel}`, `content/${rel}`].find((p) => existsSync(safeResolve(p)))!;
  return readJson(path) as T;
};
const rules = zh.withLexicon!(ZH_LEXICON);
const known = new Set(ZH_LEXICON.entries.map((e) => e.surface));

type Slot = { id: string; description: { vi: string }; variants: string[]; cueProvided: boolean };
type Task = { id: string; mode: "guided" | "open"; instruction: { vi: string }; cueFacts?: { label: { vi: string }; value: string }[];
  rubric: { requiredSlots: Slot[]; minTokens: number; maxTokens: number } };
type SpeechItem = { id: string; acceptedVariants: string[]; requiredConcepts?: string[][] };
type Node = LearnerNode | { kind: string };
type Scenario = { id: string; nodes: Record<string, Node> };
type Exercise = { id: string; type: string; answer?: string | string[]; alternatives?: (string | string[])[]; acceptedVariants?: string[] };
type Pack = { sections: { units: { lessons: { exercises: Exercise[] }[] }[] }[] };

const tasks = new Map(load<{ tasks: Task[] }>("zh/writing/tasks.json").tasks.map((t) => [t.id, t]));
const speech = new Map(load<{ items: SpeechItem[] }>("zh/speech/items.json").items.map((i) => [i.id, i]));
const scenarios = new Map(load<{ scenarios: Scenario[] }>("zh/interaction/scenarios.json").scenarios.map((s) => [s.id, s]));
const exercises = new Map(
  load<Pack>("courses/zh-vi.json").sections.flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises))).map((e) => [e.id, e])
);

const write = (id: string, text: string) => {
  const t = tasks.get(`zh.write.${id}`)!;
  const rubric: WritingRubric = { ...t.rubric, requiredSlots: t.rubric.requiredSlots.map((s) => ({ ...s, description: s.description.vi })) };
  const promptText = [t.instruction.vi, ...(t.cueFacts ?? []).flatMap((c) => [c.label.vi, c.value])].join(" ");
  return evaluateGuidedWriting({ rules, targetLanguage: "Chinese", text, rubric, promptText, knownVocabulary: known, mode: t.mode }).verdict;
};
const say = (id: string, heard: string) => {
  const it = speech.get(`zh.speak.${id}`)!;
  return gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: it.acceptedVariants, requiredConcepts: it.requiredConcepts }, rules).correct;
};
const reply = (id: string, node: string, heard: string) =>
  matchIntent(scenarios.get(`zh.scenario.${id}`)!.nodes[node] as LearnerNode, { finalTranscript: heard, alternatives: [] }, rules)?.intent ?? null;
const typed = (id: string, answer: string) => {
  const e = exercises.get(`zh-vi:${id}`)!;
  const keys = [e.answer as string, ...((e.alternatives ?? []) as string[])];
  return keys.some((k) => rules.normalizeLenient(k) === rules.normalizeLenient(answer) || rules.normalizeLenientAlternate!(k) === rules.normalizeLenientAlternate!(answer));
};

describe("P1: 很 / 非常 ⇄ 特别 before a verb or an adjective", () => {
  const spoken: [string, string][] = [
    ["l_like", "我特别喜欢唱歌"], ["k_thanks", "特别感谢您"], ["n_box", "这个箱子特别大"], ["n_room", "房间特别干净"], ["n_person", "她特别高"],
    ["cp4_desc_dog", "这只狗特别大"], ["pl_big_car", "这辆车特别大"],
  ];
  test.each(spoken)("%s accepts %s", (id, heard) => expect(say(id, heard)).toBe(true));
  test("l_like still rejects the negative and another hobby", () => {
    expect(say("l_like", "我不喜欢唱歌")).toBe(false);
    expect(say("l_like", "我特别喜欢看书")).toBe(false);
  });
  const keyed: [string, string][] = [["uf-l0-e6", "今天特别热"], ["un-l0-e6", "他特别高"], ["ut-l1-e5", "我家离工厂特别近"], ["uu-l1-e5", "我头特别疼"]];
  test.each(keyed)("%s accepts %s", (id, answer) => expect(typed(id, answer)).toBe(true));
  test("the lesson copy of l_like (ul-l2-e7) accepts what the item accepts", () => {
    expect(exercises.get("zh-vi:ul-l2-e7")!.acceptedVariants).toContain("我特别喜欢唱歌");
  });
  test("writing slots and scenario turns", () => {
    expect(write("cp5_room", "我的房间特别小。房间里有一张床。")).toBe("meets_rubric");
    expect(reply("a1cap_weekend", "l1", "公园特别漂亮")).not.toBeNull();
    expect(reply("clinic_doctor", "l0", "我头特别疼，发烧了")).not.toBeNull();
  });
  test("the rule never puts 特别 after 比 or before a noun after 多 / 少", () => {
    const answers: string[] = [];
    for (const e of exercises.values()) {
      for (const a of [e.answer, ...(e.alternatives ?? []), ...(e.acceptedVariants ?? [])]) if (typeof a === "string") answers.push(a);
    }
    for (const it of speech.values()) answers.push(...it.acceptedVariants);
    for (const t of tasks.values()) for (const s of t.rubric.requiredSlots) answers.push(...s.variants);
    for (const s of scenarios.values()) {
      for (const n of Object.values(s.nodes)) if (n.kind === "learner") for (const x of (n as LearnerNode).expected) answers.push(...x.acceptedVariants);
    }
    const withTebie = answers.filter((a) => a.includes("特别"));
    expect(withTebie.length).toBeGreaterThan(40);
    for (const a of withTebie) {
      expect(/比[^，。！？]*特别/.test(a), a).toBe(false);
      expect(/特别[多少][^了吗呢啊吧。，！？]/.test(a), a).toBe(false);
    }
  });
});

describe("P2s applied", () => {
  test("uq-l2-e0 takes 九点钟; cp5_note_late takes 一刻钟 for fifteen minutes", () => {
    expect(typed("uq-l2-e0", "我明天九点钟到")).toBe(true);
    expect(typed("uq-l2-e0", "明天我九点钟到")).toBe(true);
    expect(write("cp5_note_late", "对不起，我会晚到一刻钟。")).toBe("meets_rubric");
    expect(write("cp5_note_late", "对不起，我会晚到十五分钟。")).toBe("meets_rubric");
  });
  test("display lines", () => {
    const reading = JSON.stringify(load("zh/reception/reading.json"));
    const listening = JSON.stringify(load("zh/reception/listening.json"));
    const stories = JSON.stringify(load("zh/stories/stories.json"));
    expect(reading + listening).not.toContain("停机器");
    expect(reading).toContain("请马上把机器关了");
    expect(stories).not.toContain("送给顾客");
    expect(stories).toContain("发给顾客");
    expect(stories).toContain("Tàu chạy rồi.");
    expect(JSON.stringify(load("zh/exam/hsk-1.json"))).not.toContain("🏨");
    const lex = new Map(load<{ lexemes: { id: string; glosses: { vi: string }; examples: { target: string }[] }[] }>("zh/lexicon/lexemes.json").lexemes.map((l) => [l.id, l]));
    expect(lex.get("zh:w:xiayu")!.glosses.vi).toBe("trời mưa");
    expect(lex.get("zh:w:yu")!.glosses.vi).toBe("mưa");
    expect(lex.get("zh:w:jiating")!.examples[0]!.target).toBe("我的家庭很幸福。");
    expect(lex.get("zh:w:nan-south")!.examples[0]!.target).toBe("越南在中国南边。");
    expect(lex.get("zh:w:ting-2")!.examples[0]!.target).toBe("雨停了。");
  });
});
