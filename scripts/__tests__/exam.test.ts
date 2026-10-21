import { describe, expect, test } from "bun:test";

import type { ExamTrack } from "../../content/schema";
import { examBankDocuments, examTrackPaths } from "../lib/exam-bank";
import { examFileSlug, loadExamTracks, validateExamTrackData } from "../lib/exam";
import { loadPacks, readJson } from "../lib/pipeline";

const [REAL] = loadExamTracks("es");
const pack = loadPacks().find((p) => p.courseId === "es-vi")!.pack;
const ids = (rel: string, key: string) => new Set(((readJson(rel) as Record<string, { id: string }[]>)[key] ?? []).map((r) => r.id));
const REFS = {
  objectiveIds: ids("content/es/assessment/objectives.json", "objectives"),
  readingIds: ids("content/es/reception/reading.json", "readings"),
  clipIds: ids("content/es/reception/listening.json", "clips"),
  speechIds: ids("content/es/speech/items.json", "items"),
  writingIds: ids("content/es/writing/tasks.json", "tasks"),
  scenarioIds: ids("content/es/interaction/scenarios.json", "scenarios"),
};
const clone = (): ExamTrack => JSON.parse(JSON.stringify(REAL)) as ExamTrack;
const errorsOf = (track: ExamTrack) => validateExamTrackData({ track, lang: "es", pack, refs: REFS, nativeCodes: ["vi"] }).errors.join("\n");

describe("exam track (P3d) — the authored DELE A1 track", () => {
  test("one track at content/es/exam/dele-a1.json, file named after its id", () => {
    expect(examTrackPaths("es")).toEqual(["content/es/exam/dele-a1.json"]);
    expect(REAL.id).toBe("es.exam.dele_a1");
    expect(examFileSlug(REAL.id)).toBe("dele-a1");
  });

  test("the authored track passes every rule", () => {
    expect(errorsOf(clone())).toBe("");
  });

  test("mirrors the public format: 4 sections, 25 + 25 scored items per form, two score groups of 50 / 30", () => {
    expect(REAL.sections.map((s) => [s.id, s.minutes, s.maxPoints])).toEqual([
      ["reading", 45, 25],
      ["listening", 20, 25],
      ["writing", 25, 25],
      ["speaking", 15, 25],
    ]);
    const perForm = (sid: string) => REAL.sections.find((s) => s.id === sid)!.tasks.reduce((n, t) => n + t.itemsPerForm, 0);
    expect([perForm("reading"), perForm("listening"), perForm("writing"), perForm("speaking")]).toEqual([25, 25, 2, 4]);
    expect(REAL.groups.map((g) => [g.sectionIds, g.maxPoints, g.passPoints])).toEqual([
      [["reading", "writing"], 50, 30],
      [["listening", "speaking"], 50, 30],
    ]);
    expect(REAL.forms.map((f) => f.formId)).toEqual(["a", "b"]);
    expect(REAL.formatSource.checkedAgainstOfficialGuide).toBe(false);
  });

  test("exam items are scored-bank items: the speech, writing and interaction banks see them", () => {
    const [doc] = examBankDocuments("es");
    expect(doc.exerciseNativeCode).toBe("vi");
    expect(doc.items.length).toBe(REAL.items.length);
  });
});

describe("exam track rules — every rule fires", () => {
  test("parallel forms are disjoint", () => {
    const t = clone();
    t.forms[1].itemIds.push(t.forms[0].itemIds[0]);
    expect(errorsOf(t)).toContain("parallel forms are disjoint");
  });

  test("every form administers exactly itemsPerForm items per task", () => {
    const t = clone();
    t.forms[0].itemIds = t.forms[0].itemIds.slice(1);
    expect(errorsOf(t)).toMatch(/form a: reading\/t1 has 4 item\(s\), the format needs 5/);
  });

  test("an item in no form is a dead bank item", () => {
    const t = clone();
    t.forms[0].itemIds = t.forms[0].itemIds.filter((id) => id !== t.items[0].id);
    expect(errorsOf(t)).toContain("appears in no form");
  });

  test("results may never claim a pass", () => {
    const t = clone();
    t.readiness.bands[0].message = { vi: "Bạn sẽ đỗ kỳ thi này." };
    expect(errorsOf(t)).toContain('claims a result: "sẽ đỗ"');
  });

  test("readiness labels and the disclaimer say ESTIMATE", () => {
    const t = clone();
    t.readiness.bands[0].label = { vi: "Sẵn sàng" };
    expect(errorsOf(t)).toContain("must say it is an estimate");
  });

  test("bands are strictly decreasing and end at 0", () => {
    const t = clone();
    t.readiness.bands[2].minGroupShare = 0.1;
    expect(errorsOf(t)).toContain("the last readiness band must start at minGroupShare 0");
    const u = clone();
    u.readiness.bands[1].minGroupShare = 0.8;
    expect(errorsOf(u)).toContain("strictly decreasing");
  });

  test("score groups cover every section once and sum their points", () => {
    const t = clone();
    t.groups[1].sectionIds = ["listening"];
    expect(errorsOf(t)).toContain("section speaking belongs to no score group");
    expect(errorsOf(t)).toContain("maxPoints 50 ≠ the sum of its sections (25)");
  });

  test("stimulus references resolve", () => {
    const t = clone();
    (t.items[0].exercise as { readingId: string }).readingId = "es.read.nope";
    expect(errorsOf(t)).toContain("unknown readingId es.read.nope");
  });

  test("mcq3 / matching items offer exactly three options", () => {
    const t = clone();
    (t.items[0].exercise as { options: { text: string }[] }).options.push({ text: "Toledo" });
    expect(errorsOf(t)).toContain("offer exactly 3 options");
  });

  test("a section skill only takes its own exercise types", () => {
    const t = clone();
    const listening = t.items.find((i) => i.sectionId === "listening")!;
    listening.sectionId = "reading";
    listening.taskId = "t1";
    expect(errorsOf(t)).toContain("listeningComprehension cannot assess reading");
  });

  test("objective targets resolve", () => {
    const t = clone();
    t.items[0].objectiveTargets = ["es.obj.reading.nope"];
    expect(errorsOf(t)).toContain("unknown objective es.obj.reading.nope");
  });

  test("native text is complete for every rich native language", () => {
    const errors = validateExamTrackData({ track: clone(), lang: "es", pack, refs: REFS, nativeCodes: ["vi", "ja"] }).errors.join("\n");
    expect(errors).toContain('missing "ja" text');
  });
});

describe("compiled exam artifact", () => {
  test("es-vi ships the DELE A1 track with native text resolved and weak-area lexemes", () => {
    const artifact = readJson("src/content/exam/es-exam-tracks.json") as { tracks: { id: string; title: string; items: { lexemeRefs: string[] }[]; forms: unknown[] }[] };
    expect(artifact.tracks.map((t) => t.id)).toEqual(["es.exam.dele_a1"]);
    expect(typeof artifact.tracks[0].title).toBe("string");
    expect(artifact.tracks[0].items.length).toBe(REAL.items.length);
    expect(artifact.tracks[0].items.some((i) => i.lexemeRefs.length > 0)).toBe(true);
    expect(artifact.tracks[0].forms.length).toBe(2);
  });
});
