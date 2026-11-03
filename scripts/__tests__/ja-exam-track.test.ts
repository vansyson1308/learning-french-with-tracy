/**
 * The JLPT N5 practice track of ja-vi (P4c session 5): honest wording and the published format. The track is staged
 * until `author.ts promote`; afterwards it lives at content/ja/exam/jlpt-n5.json — the test reads whichever exists.
 * The full rule set (forms, options, stimuli, objectives) runs in course-draft validate and content:validate.
 */
import { existsSync } from "fs";

import { describe, expect, test } from "bun:test";

import { examTrackSchema } from "../../content/schema";
import { readJson, safeResolve } from "../lib/pipeline";

const PATHS = ["content/ja/exam/jlpt-n5.json", "content/ja/_drafts/staged/content/ja/exam/jlpt-n5.json"];
const path = PATHS.find((p) => existsSync(safeResolve(p)))!;
const track = examTrackSchema("ja").parse(readJson(path));
const vi = (r: Record<string, string>) => r.vi ?? "";
const allText = () =>
  [track.title, track.description, track.formatSource.note, track.readiness.incomplete, track.readiness.disclaimer, ...track.readiness.bands.flatMap((b) => [b.label, b.message]),
   ...track.sections.flatMap((s) => [s.title, ...s.tasks.flatMap((t) => [t.title, t.instruction])])].map(vi);

describe("JLPT N5 track (ja-vi)", () => {
  test("the published sections, times and pass marks (jlpt.jp, read 2026-11-03)", () => {
    expect(track.sections.map((s) => [s.id, s.minutes])).toEqual([["moji_goi", 20], ["bunpou_dokkai", 40], ["choukai", 30]]);
    expect(track.passRule.groups!.map((g) => [g.sections, g.min])).toEqual([[["moji_goi", "bunpou_dokkai"], 38], [["choukai"], 19]]);
    expect(track.passRule.total!.min).toBe(80);
    expect(track.sections.reduce((n, s) => n + s.maxPoints, 0)).toBe(180);
    expect(track.passRule.everySectionTaken).toBe(true);
  });

  test("four options to every item but the last two listening parts, which have three", () => {
    const formats = track.sections.flatMap((s) => s.tasks.map((t) => [t.id, t.format]));
    expect(formats.filter(([, f]) => f === "mcq3").map(([id]) => id)).toEqual(["c3", "c4"]);
    expect(formats.every(([id, f]) => f === "mcq4" || id === "c3" || id === "c4")).toBe(true);
  });

  test("two disjoint forms of 67 items, original items only", () => {
    expect(track.forms.map((f) => f.itemIds.length)).toEqual([67, 67]);
    expect(new Set(track.forms.flatMap((f) => f.itemIds)).size).toBe(134);
    expect(track.formatSource.checkedAgainstOfficialGuide).toBe(true);
    expect(track.formatSource.references.every((r) => r.url.startsWith("https://www.jlpt.jp/") && r.retrieved === "2026-11-03")).toBe(true);
  });

  test("partial fidelity, said in the description: item counts and scaled scores are not reproduced", () => {
    expect(track.formatFidelity).toBe("partial");
    expect(vi(track.description)).toContain("số câu ở đây do khoá học chọn");
    expect(vi(track.description)).toContain("điểm quy đổi");
  });

  test("readiness is an estimate, never a pass, and N5 is never called a CEFR level", () => {
    for (const b of track.readiness.bands) expect(vi(b.label)).toContain("Mức sẵn sàng ước tính");
    expect(vi(track.readiness.disclaimer)).toContain("ước tính");
    for (const text of allText()) {
      expect(text).not.toMatch(/sẽ đỗ|chắc chắn đỗ|đảm bảo đỗ|will pass|guarantee/i);
      expect(text).not.toMatch(/tương đương (CEFR|A1)|N5 (là|=) A1|bậc A1 của JLPT/i);
    }
    expect(vi(track.description)).toContain("JLPT N5 không phải một bậc của khung CEFR");
    expect(vi(track.readiness.disclaimer)).toContain("JLPT N5 không phải một bậc của khung CEFR");
  });

  test("kanji-reading and spelling items hide their readings; vocabulary items name the words they test", () => {
    for (const item of track.items.filter((i) => i.taskId === "m1" || i.taskId === "m2")) {
      expect((item.exercise as { scriptAid?: string }).scriptAid).toBe("hidden");
      expect(item.lexemeRefs?.length).toBe(1);
    }
    expect(track.items.filter((i) => (i.exercise as { scriptAid?: string }).scriptAid === "hidden").every((i) => i.taskId === "m1" || i.taskId === "m2")).toBe(true);
  });
});
