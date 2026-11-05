/**
 * P4e session 5: the ko-vi TOPIK I practice track (content/ko/exam/topik-i.json, staged until promote) keeps the
 * figures of the NIIED regulation it cites — two disjoint forms of 30 listening + 40 reading items, 40 + 60 minutes,
 * a total of 200 with the 1급 threshold 80 — and is honest about what was read: the regulation (with its retrieval
 * date), not topik.go.kr (no date, and the note says so). The schema and validator run in content:validate /
 * course-draft validate; this test pins the facts the coordinator asked for.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";

import { examTrackSchema } from "../../content/schema";
import { readJson } from "../lib/pipeline";

const STAGED = "content/ko/_drafts/staged/content/ko/exam/topik-i.json";
const PATH = existsSync(STAGED) ? STAGED : "content/ko/exam/topik-i.json";

describe("ko-vi TOPIK I track", () => {
  test.skipIf(!existsSync(PATH))("the PBT figures of the regulation, two disjoint full forms", () => {
    const track = examTrackSchema("ko").parse(readJson(PATH));
    expect(track.formatFidelity).toBe("partial");
    const minutes = Object.fromEntries(track.sections.map((s) => [s.id, s.minutes]));
    expect(minutes).toEqual({ listening: 40, reading: 60 });
    expect(track.sections.reduce((n, s) => n + s.maxPoints, 0)).toBe(200);
    expect(track.passRule.total?.min).toBe(80);
    expect(track.forms.map((f) => f.formId)).toEqual(["a", "b"]);
    const sectionOf = new Map(track.items.map((i) => [i.id, i.sectionId]));
    const [a, b] = track.forms.map((f) => new Set(f.itemIds));
    expect([...a].filter((id) => b.has(id))).toEqual([]);
    for (const form of track.forms) {
      const count = (sid: string) => form.itemIds.filter((id) => sectionOf.get(id) === sid).length;
      expect([count("listening"), count("reading")], form.formId).toEqual([30, 40]);
    }
    for (const item of track.items) {
      const options = (item.exercise as { options?: unknown[] }).options;
      expect(options?.length, item.id).toBe(4);
    }
  });

  test.skipIf(!existsSync(PATH))("checkedAgainstOfficialGuide is honest: the regulation was read, topik.go.kr was not", () => {
    const track = examTrackSchema("ko").parse(readJson(PATH));
    const src = track.formatSource;
    expect(src.checkedAgainstOfficialGuide).toBe(true);
    const regulation = src.references.find((r) => r.url.includes("niied.go.kr"));
    const guide = src.references.find((r) => r.url.includes("topik.go.kr"));
    expect(regulation?.retrieved).toBe("2026-11-05");
    expect(guide?.retrieved).toBeUndefined();
    expect(guide?.title).toContain("not read");
    expect(src.note.vi).toContain("topik.go.kr");
    // A form with no voice reports reading only, and the track says so.
    expect(track.readiness.incomplete.vi).toContain("chỉ báo phần Đọc");
    expect(track.description.vi).toContain("giọng đọc");
  });
});
