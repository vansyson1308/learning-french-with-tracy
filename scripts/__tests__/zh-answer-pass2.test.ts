/**
 * Answer-key review pass 2 of zh-vi (content/zh/_drafts/review/findings-answers2.json, 2026-11-05): the reviewer's
 * own example answers, run through the app's graders over the course content — every correct answer the reviewer
 * found rejected is accepted, every wrong one found accepted is rejected. Engine root causes (a)-(c) live in
 * src/lib/__tests__/answer-runs.test.ts; this file holds the content side: the four root causes on the real items, the
 * five pass-1 fixes that were incomplete, the scenario concepts of root cause (d), and the twins of the speech items.
 * Content is read from the staged layer while it exists, else from content/ (after `author.ts promote`).
 */
import { existsSync } from "fs";

import { describe, expect, test } from "bun:test";

import { matchIntent, type LearnerNode } from "../../src/lib/interaction/machine";
import { zh } from "../../src/lib/languages/zh";
import { gradeSpokenAttempt } from "../../src/lib/speech/grader";
import { evaluateGuidedWriting, evaluateSimpleForm, type WritingRubric } from "../../src/lib/writing/rubric";
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
  rubric: { requiredSlots: Slot[]; minTokens: number; maxTokens: number; requireSentenceVerbs?: string[] }; modelAnswers: string[];
  formFields?: { id: string; label: string; slotId: string }[] };
type SpeechItem = { id: string; acceptedVariants: string[]; requiredConcepts?: string[][] };
type Scenario = { id: string; nodes: Record<string, LearnerNode | { kind: string }> };
type Exercise = { id: string; type: string; answer?: string | string[]; alternatives?: (string | string[])[]; tokens?: string[]; acceptedVariants?: string[]; speechItemId?: string };
type Pack = { sections: { units: { lessons: { exercises: Exercise[] }[] }[] }[] };

const tasks = new Map(load<{ tasks: Task[] }>("zh/writing/tasks.json").tasks.map((t) => [t.id, t]));
const speech = new Map(load<{ items: SpeechItem[] }>("zh/speech/items.json").items.map((i) => [i.id, i]));
const scenarios = new Map(load<{ scenarios: Scenario[] }>("zh/interaction/scenarios.json").scenarios.map((s) => [s.id, s]));
const exercises = new Map(
  load<Pack>("courses/zh-vi.json").sections.flatMap((s) => s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises))).map((e) => [e.id, e])
);

const rubricOf = (t: Task): WritingRubric => ({ ...t.rubric, requiredSlots: t.rubric.requiredSlots.map((s) => ({ ...s, description: s.description.vi })) });
const write = (id: string, text: string) => {
  const t = tasks.get(`zh.write.${id}`)!;
  const promptText = [t.instruction.vi, ...(t.cueFacts ?? []).flatMap((c) => [c.label.vi, c.value])].join(" ");
  return evaluateGuidedWriting({ rules, targetLanguage: "Chinese", text, rubric: rubricOf(t), promptText, knownVocabulary: known, mode: t.mode }).verdict;
};
const form = (id: string, phone: string) => {
  const t = tasks.get(`zh.write.${id}`)!;
  const model = t.modelAnswers[0]!.split(" | ");
  const values = Object.fromEntries(t.formFields!.map((f, i) => [f.id, f.slotId === "phone" ? phone : model[i]!]));
  return evaluateSimpleForm({ rules, targetLanguage: "Chinese", values, fields: t.formFields!, rubric: rubricOf(t) }).verdict;
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

describe("(a)+(b) writing: insertions inside a slot, 早上好, and the four open menus", () => {
  const meets: [string, string][] = [
    ["p_who", "阮南早上喝一杯咖啡。"], ["p_who", "阮南早上喝了咖啡。"],
    ["p_link", "我吃了早饭以后去上班。"], ["p_link", "吃完早饭以后，我去上班。"], ["p_link", "我先吃早餐，然后去工厂。"],
    ["p_ask", "你住在什么地方？"],
    ["q_sick", "李组长，早上好！我发烧了，今天想请假。"], ["q_sick", "李组长，您好！我发烧了，今天想请一天假。"], ["q_sick", "李组长，您好！我发烧了，今天不去上班了。"],
    ["q_late", "王经理，早上好！公交车来晚了，对不起！"],
    ["q_reply", "好，谢谢！"], ["q_reply", "懂了，谢谢！"], ["q_reply", "明白，谢谢！"],
    ["r_note", "机器坏了，请找组长来。"], ["r_note", "机器坏了，请叫一下组长。"], ["r_note", "机器坏了，请叫李组长来。"], ["r_note", "机器出问题了，请叫组长来。"],
    ["cp5_room", "我的房间非常小。房间里有一张床。"], ["cp5_room", "我的房间有点儿小。房间里有张床。"],
    ["cp5_note_sick", "组长，早上好！我感冒了，今天想请假。"], ["cp5_note_sick", "组长，您好！我感冒了，今天想请一天假。"],
    ["cp5_mail_shift", "王经理，您好！星期六我想休息，可以吗？"], ["cp5_mail_shift", "王经理，您好！星期六我可以请一天假吗？"], ["cp5_mail_shift", "王经理，早上好！星期六我可以请假吗？"],
    ["a1cap_mail_absent", "王经理，您好！星期四我要去医院，不能来上班。"], ["a1cap_mail_absent", "王经理，您好！星期四我要去医院，想请一天假。"],
    ["a1cap_note_home", "小李，我在超市，五点回去。"], ["a1cap_note_home", "小李，我在超市，五点到家。"],
    ["cp5_note_movie", "小王，我们七点去电影院吧！"],
    ["o_open", "我有两个妹妹。我今年二十岁。"], ["o_open", "我家有四口人。我在河内。"],
    ["p_open", "我七点吃早饭，八点去工厂。"], ["p_open", "早上我喝咖啡，然后去工作。晚上我看电视。"],
    ["q_open", "小王，明天见！"], ["q_open", "小王，生日快乐！"], ["q_open", "小王，星期六你有时间吗？"],
    ["r_open", "我是工人。我每天八点去车间。"], ["r_open", "我在仓库搬箱子，很累。"], ["r_open", "我是司机，我开出租车。"],
  ];
  test.each(meets)("%s: %s meets the rubric", (id, text) => expect(write(id, text)).toBe("meets_rubric"));
  const fails: [string, string][] = [
    ["p_who", "阮南早上喝茶。"], ["r_note", "机器坏了，请叫王经理来。"], ["cp5_room", "我的房间很大。房间里有一张床。"], ["q_sick", "李组长，早上好！我发烧了。"],
  ];
  test.each(fails)("%s: %s still does not", (id, text) => expect(write(id, text)).toBe("does_not_meet_rubric"));
  test("the five phone slots take the number unbroken, hyphenated or with spaces", () => {
    const phones: [string, string][] = [["r_form_bank", "138 1234 5678"], ["r_form_dorm", "139 8765 4321"], ["cp5_form_bank", "137 2222 3333"], ["cp5_form_clinic", "139 1111 2222"], ["cp5_form_work", "136 4444 5555"]];
    for (const [id, spaced] of phones) {
      for (const phone of [spaced, spaced.replace(/ /g, ""), spaced.replace(/ /g, "-")]) expect(form(id, phone)).toBe("meets_rubric");
      expect(form(id, spaced.replace(/.$/, "0"))).toBe("does_not_meet_rubric");
    }
  });
});

describe("(c) speech: the frame, the lesson forms, and the twins", () => {
  const accepted: [string, string][] = [
    ["k_thanks", "组长，谢谢您"], ["k_thanks", "谢谢您，组长"], ["k_thanks", "非常感谢您"], ["k_thanks", "太感谢了"], ["k_thanks", "谢谢啊"],
    ["k_sorry", "对不起，我迟到了五分钟"], ["k_sorry", "组长，对不起，我迟到了"], ["k_sorry", "不好意思，我晚到了"],
    ["k_xianzou", "我先回去了"], ["k_xianzou", "我走了，明天见"], ["k_xianzou", "我先走了，拜拜"], ["k_xianzou", "我先走了，明天见啊"],
    ["k_excuse", "打扰一下"], ["k_excuse", "请问一下"], ["k_greet_morning", "王经理，早上好"], ["k_greet_morning", "大家早上好啊"],
    ["l_name", "我的名字叫阮海"], ["l_name", "你好，我是阮海"], ["l_name", "大家好，我叫阮海"], ["l_age", "我今年二十五岁了"], ["l_from", "我来自越南"],
    ["l_work", "我在一个工厂工作"], ["l_work", "我在工厂里工作"],
    ["m_tickets", "我想要两张票"], ["m_tickets", "我想买两张票"], ["m_tickets", "我要买两张票"], ["m_time", "八点钟"], ["m_time", "现在八点钟"],
    ["m_birthday", "我生日五月十号"], ["m_price", "一碗面条十八块"], ["m_price", "面条一碗十八块"], ["m_day", "今天周一"],
    ["n_box", "这个箱子真大"], ["n_box", "这个箱子好大"], ["n_room", "房间真干净"], ["n_person", "她个子很高"],
    ["cp4_thanks_water", "太谢谢了"], ["cp4_thanks_water", "非常感谢"], ["cp4_thanks_water", "谢谢啊"],
    ["cp4_name_hua", "我的名字叫阮花"], ["cp4_name_hua", "你好，我叫阮花"], ["cp4_vietnamese", "我来自越南"], ["cp4_tickets_three", "我想买三张票"],
    ["cp4_student", "我是一名大学生"], ["cp4_greet_evening", "晚上好啊"], ["cp4_work_shop", "我在超市里工作"], ["cp4_work_shop", "我在一个超市工作"],
    ["cp4_time_ten", "十点钟"], ["a1cap_time_nine", "九点钟"], ["a1cap_birthday", "我生日九月二十号"], ["cp4_desc_shirt", "这是一件白色的衣服"],
    ["pl_name_nam", "我的名字叫阮南"], ["pl_name_nam", "你好，我叫阮南"], ["pl_age", "我今年三十岁了"], ["pl_big_car", "这辆车非常大"], ["pl_big_car", "这辆汽车很大"],
  ];
  test.each(accepted)("%s accepts %s", (id, heard) => expect(say(id, heard)).toBe(true));
  const rejected: [string, string][] = [["l_name", "我叫阮南"], ["m_tickets", "我想买三张票"], ["l_age", "我今年二十六岁了"], ["pl_name_nam", "我叫阮海"]];
  test.each(rejected)("%s still rejects %s", (id, heard) => expect(say(id, heard)).toBe(false));
});

describe("(d) scenarios: full-phrase concepts, numbers by their variants", () => {
  const accepted: [string, string, string][] = [
    ["a1cap_shift_change", "l0", "行"], ["factory_safety", "l0", "懂了"], ["factory_safety", "l0", "我懂了"], ["bank_account", "l1", "我填完了"],
    ["a1cap_weekend", "l1", "很美"], ["a1cap_weekend", "l1", "公园很美"], ["restaurant_order", "l0", "我要一个盒饭和一瓶水"], ["shop_fruit", "l1", "可以用微信付吗"],
    ["cp6_supermarket_pay", "l1", "不需要了，谢谢"], ["a1cap_friend_plan", "l0", "我有空"], ["a1cap_friend_plan", "l1", "三点见"], ["a1cap_friend_plan", "l1", "下午三点"],
    ["clinic_doctor", "l1", "疼了两天了"], ["clinic_doctor", "l0", "我头痛，还发烧"], ["warehouse_boxes", "l1", "一共有二十个"], ["taxi", "l1", "好，就在这儿"], ["taxi", "l1", "好的"],
    ["a1cap_canteen_lunch", "l0", "好啊，一起去"],
  ];
  test.each(accepted)("%s/%s accepts %s", (id, node, heard) => expect(reply(id, node, heard)).not.toBeNull());
  const rejected: [string, string, string][] = [
    ["a1cap_friend_plan", "l0", "星期天我有事。"], ["a1cap_friend_plan", "l1", "三点半吧。"], ["clinic_doctor", "l1", "两个星期了"], ["clinic_doctor", "l1", "两个小时"],
    ["warehouse_boxes", "l1", "一共二十五个"], ["taxi", "l1", "这儿不能停"], ["a1cap_canteen_lunch", "l0", "我已经吃好了"], ["clinic_reception", "l0", "是第二次"],
  ];
  test.each(rejected)("%s/%s rejects %s", (id, node, heard) => expect(reply(id, node, heard)).toBeNull());
});

describe("typed answers and word banks", () => {
  const accepted: [string, string][] = [
    ["ua-l3-e7", "我也是一名工人"], ["ua-l1-e7", "你有哥哥没有"], ["uc-l3-e7", "厕所在哪儿"], ["uc-l3-e7", "卫生间在哪里"], ["ud-l0-e7", "现在是几点"], ["ud-l0-e7", "现在几点钟"],
    ["ud-l3-e7", "我曾经去过中国"], ["ue-l0-e7", "我在学中文"], ["uf-l2-e6", "秋天的天气非常好"], ["uf-l0-e6", "今天好热"], ["uj-l1-e6", "我每天都洗澡"], ["uj-l1-e6", "每天我都洗澡"],
    ["uj-l0-e6", "我住在宿舍里"], ["uc-l0-e7", "我在宿舍里"], ["uj-l3-e5", "你几点钟回家"], ["uk-l3-e5", "懂了"], ["ul-l0-e6", "我今年二十岁了"], ["ul-l0-e6", "今年我20岁了"],
    ["ul-l3-e5", "我爱听音乐"], ["ul-l2-e5", "我会说普通话"], ["um-l0-e6", "你的号码是多少"], ["um-l2-e5", "我们下午三点见吧"], ["un-l2-e4", "这个比那个更便宜"],
    ["un-l2-e4", "这个比那个便宜点儿"], ["uo-l1-e2", "我今年二十三岁了"], ["uo-l2-e1", "我每天都在工厂工作"], ["uo-l2-e1", "我每天在工厂上班"], ["uo-l3-e1", "我在一个中国公司工作"],
    ["uo-l1-e0", "我名字叫阮海"], ["up-l2-e4", "如果明天下雨的话，我就不去"], ["up-l2-e4", "要是明天下雨，我就不去"], ["ur-l3-e4", "我的护照在我的包里"], ["us-l3-e5", "一共是多少钱"],
    ["us-l2-e5", "我肚子饿了"], ["ut-l3-e4", "一直向前走"], ["uu-l3-e5", "每天吃三次"], ["uu-l3-e5", "一天吃三次药"], ["uv-l0-e5", "我打电话给我妈妈"], ["uv-l1-e4", "我要请一天假"],
    ["uv-l2-e4", "请你再说一遍"], ["uv-l2-e4", "再说一遍"],
  ];
  test.each(accepted)("%s accepts %s", (id, answer) => expect(typed(id, answer)).toBe(true));
  test("u1-l2-e6: the tiles 我 名字 叫 阮海 build an accepted sentence", () => {
    const e = exercises.get("zh-vi:u1-l2-e6")!;
    expect([e.answer, ...(e.alternatives ?? [])].map((a) => (a as string[]).join(" "))).toContain("我 名字 叫 阮海");
  });
});

describe("HSK 1 a_l4_03 and the checkpoint mirrors", () => {
  test("the question asks for tomorrow's age, the clip says 就十八岁了", () => {
    const hsk1 = load<{ items: { id: string; exercise: { clipId: string; question: string; options: { text: string }[]; correct: number } }[] }>("zh/exam/hsk-1.json");
    const item = hsk1.items.find((i) => i.id === "zh.exi.hsk_1.a_l4_03")!;
    const clip = load<{ clips: { id: string; segments: { text: string }[] }[] }>("zh/reception/listening.json").clips.find((c) => c.id === item.exercise.clipId)!;
    expect(clip.segments.map((s) => s.text).join("")).toBe("明天是我的生日，我就十八岁了。");
    expect(item.exercise.question).toBe("Ngày mai người nói bao nhiêu tuổi?");
    expect(item.exercise.options[item.exercise.correct]!.text).toBe("十八岁");
  });
  test("every checkpoint and placement speech exercise accepts exactly what its item accepts", () => {
    const cps = load<{ checkpoints: { items: { exercise: Exercise }[] }[] }>("zh/assessment/checkpoints.json").checkpoints.flatMap((c) => c.items.map((i) => i.exercise));
    const pl = load<{ stages: { clusters: { items: { exercise: Exercise }[] }[] }[] }>("zh/assessment/placement.json").stages.flatMap((s) => s.clusters.flatMap((c) => c.items.map((i) => i.exercise)));
    const spoken = [...cps, ...pl].filter((e) => e.speechItemId !== undefined);
    expect(spoken.length).toBeGreaterThan(10);
    for (const e of spoken) expect(e.acceptedVariants).toEqual(speech.get(e.speechItemId!)!.acceptedVariants);
  });
});
