/**
 * The HSK 1 and HSK 2 practice tracks of zh-vi (P4d session 4): honest wording and the official HSK 3.0 sample
 * format. The tracks are staged until `author.ts promote`; afterwards they live at content/zh/exam/hsk-<n>.json — the
 * test reads whichever exists. The full rule set (forms, pools, options, stimuli, objectives) runs in course-draft
 * validate and content:validate.
 */
import { existsSync } from "fs";

import { describe, expect, test } from "bun:test";

import { examTrackSchema, type ExamTrack } from "../../content/schema";
import { readJson, safeResolve } from "../lib/pipeline";

const load = (slug: string): ExamTrack => {
  const path = [`content/zh/exam/${slug}.json`, `content/zh/_drafts/staged/content/zh/exam/${slug}.json`].find((p) => existsSync(safeResolve(p)))!;
  return examTrackSchema("zh").parse(readJson(path));
};
const hsk1 = load("hsk-1");
const hsk2 = load("hsk-2");
const vi = (r: Record<string, string>) => r.vi ?? "";
const allText = (track: ExamTrack) =>
  [track.title, track.description, track.formatSource.note, track.readiness.incomplete, track.readiness.disclaimer, ...track.readiness.bands.flatMap((b) => [b.label, b.message]),
   ...(track.passRule.total ? [track.passRule.total.title] : []), ...track.sections.flatMap((s) => [s.title, ...s.tasks.flatMap((t) => [t.title, t.instruction])])].map(vi);
const perTask = (track: ExamTrack) => track.sections.map((s) => [s.id, s.minutes, s.tasks.map((t) => [t.id, t.format, t.itemsPerForm])]);

describe("HSK 1 and HSK 2 tracks (zh-vi)", () => {
  test("HSK 1 follows the official HSK 3.0 sample: 听力 20 items in about 12 minutes, 阅读 20 in 20", () => {
    expect(perTask(hsk1)).toEqual([
      ["tingli", 12, [["l1", "pictureMcq", 5], ["l2", "mcq3", 5], ["l3", "matchToPool", 5], ["l4", "mcq3", 5]]],
      ["yuedu", 20, [["r1", "matchToPool", 5], ["r2", "matchToPool", 5], ["r3", "completeFromPool", 5], ["r4", "mcq3", 5]]],
    ]);
    expect(hsk1.forms.map((f) => f.itemIds.length)).toEqual([40, 40]);
  });

  test("HSK 2 follows the official HSK 3.0 sample: 听力 25 (17 min), 阅读 25 (25 min), 书写 10 (10 min)", () => {
    expect(perTask(hsk2)).toEqual([
      ["tingli", 17, [["l1", "pictureMcq", 5], ["l2a", "matchToPool", 5], ["l2b", "matchToPool", 5], ["l3", "mcq3", 10]]],
      ["yuedu", 25, [["r1", "matchToPool", 5], ["r2", "completeFromPool", 5], ["r3a", "matchToPool", 5], ["r3b", "matchToPool", 5], ["r4", "mcq3", 5]]],
      ["shuxie", 10, [["w1", "cloze", 5], ["w2", "formCompletion", 5]]],
    ]);
    expect(hsk2.forms.map((f) => f.itemIds.length)).toEqual([60, 60]);
  });

  test("two disjoint forms per level, every pool of six with distinct keys", () => {
    for (const track of [hsk1, hsk2]) {
      const ids = track.forms.flatMap((f) => f.itemIds);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBe(track.items.length);
      for (const form of track.forms) {
        const byTask = new Map<string, number[]>();
        for (const id of form.itemIds) {
          const item = track.items.find((i) => i.id === id)!;
          const e = item.exercise as { options?: { text: string }[]; correct?: number };
          if ((e.options?.length ?? 0) === 6) byTask.set(item.taskId, [...(byTask.get(item.taskId) ?? []), e.correct!]);
        }
        for (const keys of byTask.values()) expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  test("checked against the official documents, partial fidelity, scoring stated as the course's reference", () => {
    for (const track of [hsk1, hsk2]) {
      expect(track.formatFidelity).toBe("partial");
      expect(track.formatSource.checkedAgainstOfficialGuide).toBe(true);
      expect(track.formatSource.references.some((r) => r.url === "https://www.chinesetest.cn/news/51336883" && r.retrieved === "2026-11-04")).toBe(true);
      expect(vi(track.description)).toContain("13/12/2026");
      expect(vi(track.description)).toContain("không lấy từ đề thi hay đề mẫu");
      expect(vi(track.passRule.total!.title)).toContain("chưa công bố điểm đạt");
      expect(track.passRule.groups).toBeUndefined();
    }
    expect([hsk1.passRule.total!.min, hsk1.sections.reduce((n, s) => n + s.maxPoints, 0)]).toEqual([120, 200]);
    expect([hsk2.passRule.total!.min, hsk2.sections.reduce((n, s) => n + s.maxPoints, 0)]).toEqual([180, 300]);
  });

  test("readiness is an estimate, never a pass, and an HSK level is never called a CEFR level", () => {
    for (const track of [hsk1, hsk2]) {
      for (const b of track.readiness.bands) expect(vi(b.label)).toContain("Mức sẵn sàng ước tính");
      expect(vi(track.readiness.disclaimer)).toContain("ước tính");
      expect(vi(track.readiness.disclaimer)).toContain("không phải một bậc của khung CEFR");
      for (const text of allText(track)) {
        expect(text).not.toMatch(/sẽ đỗ|chắc chắn đỗ|đảm bảo đỗ|will pass|guarantee/i);
        expect(text).not.toMatch(/tương đương (CEFR|A1|A2)|HSK [12] (là|=) A[12]|bậc A[12] của HSK/i);
      }
      expect(vi(track.description)).toContain(`${track.name} không phải một bậc của khung CEFR`);
    }
  });

  test("the component items hide their readings and name their word; the typed items ask for one character", () => {
    for (const item of hsk2.items.filter((i) => i.taskId === "w1")) {
      expect((item.exercise as { scriptAid?: string }).scriptAid).toBe("hidden");
      expect(item.lexemeRefs?.length).toBeGreaterThan(0);
    }
    for (const item of hsk2.items.filter((i) => i.taskId === "w2")) {
      const e = item.exercise as { type: string; answer: string; alternatives: string[] };
      expect(e.type).toBe("typeAnswer");
      expect([...e.answer].length).toBe(1);
      expect(e.alternatives).toEqual([]);
    }
    expect([...hsk1.items, ...hsk2.items].filter((i) => (i.exercise as { scriptAid?: string }).scriptAid === "hidden").every((i) => i.taskId === "w1")).toBe(true);
  });
});
