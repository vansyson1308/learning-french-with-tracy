import { describe, expect, test } from "bun:test";

import type { ExamTrack } from "../../content/schema";
import { examBankDocuments, examTrackPaths } from "../lib/exam-bank";
import { examFileSlug, loadExamTracks, validateExamTrackData, wordCount, type ExamRefs } from "../lib/exam";
import { loadPacks, readJson } from "../lib/pipeline";

const [REAL] = loadExamTracks("es");
const pack = loadPacks().find((p) => p.courseId === "es-vi")!.pack;
const doc = <T>(rel: string, key: string) => ((readJson(rel) as Record<string, T[]>)[key] ?? []) as T[];
const ids = (rel: string, key: string) => new Set(doc<{ id: string }>(rel, key).map((r) => r.id));
type Reading = { id: string; blocks: { text: string }[]; use?: string };
type Clip = { id: string; segments: { text: string }[]; scoredPlaybackPolicy: { maxPlays: number }; use?: string };
const REFS: ExamRefs = {
  objectiveIds: ids("content/es/assessment/objectives.json", "objectives"),
  readings: new Map(doc<Reading>("content/es/reception/reading.json", "readings").map((r) => [r.id, { texts: [r.blocks.map((b) => b.text).join(" ")], blocks: r.blocks.map((b) => b.text), use: r.use }])),
  clips: new Map(doc<Clip>("content/es/reception/listening.json", "clips").map((c) => [c.id, { texts: [c.segments.map((s) => s.text).join(" ")], blocks: c.segments.map((s) => s.text), maxPlays: c.scoredPlaybackPolicy.maxPlays, use: c.use }])),
  speechIds: ids("content/es/speech/items.json", "items"),
  writingIds: ids("content/es/writing/tasks.json", "tasks"),
  scenarioIds: ids("content/es/interaction/scenarios.json", "scenarios"),
};
const clone = (): ExamTrack => JSON.parse(JSON.stringify(REAL)) as ExamTrack;
const errorsOf = (track: ExamTrack, refs: ExamRefs = REFS) => validateExamTrackData({ track, lang: "es", pack, refs, nativeCodes: ["vi"] }).errors.join("\n");
const itemOf = (t: ExamTrack, form: string, section: string, task: string, n = 1) => t.items.find((i) => i.id === `es.exi.dele_a1.${form}_${section[0]}${task.slice(1)}_${String(n).padStart(2, "0")}`)!;
type Options = { text: string; emoji?: string }[];
const ex = (i: { exercise: unknown }) => i.exercise as { options: Options; correct: number; readingId?: string; clipId?: string; modelAnswers?: string[] };

describe("DELE A1 track — the 2020 model (P3e)", () => {
  test("one track at content/es/exam/dele-a1.json, file named after its id", () => {
    expect(examTrackPaths("es")).toEqual(["content/es/exam/dele-a1.json"]);
    expect(REAL.id).toBe("es.exam.dele_a1");
    expect(examFileSlug(REAL.id)).toBe("dele-a1");
    expect(REAL.trackVersion).toBe(2);
  });

  test("the authored track passes every rule", () => {
    expect(errorsOf(clone())).toBe("");
  });

  test("sections, timing and tasks follow the 2020 specification", () => {
    expect(REAL.sections.map((s) => [s.id, s.minutes, s.preparationMinutes ?? 0, s.maxPoints])).toEqual([
      ["reading", 45, 0, 25],
      ["listening", 25, 0, 25],
      ["writing", 25, 0, 25],
      ["speaking", 10, 10, 25],
    ]);
    const tasks = (sid: string) => REAL.sections.find((s) => s.id === sid)!.tasks.map((t) => [t.format, t.itemsPerForm, t.poolSize ?? 0]);
    expect(tasks("reading")).toEqual([["mcq3", 5, 0], ["matchToPool", 6, 9], ["matchToPool", 6, 9], ["mcq3", 8, 0]]);
    expect(tasks("listening")).toEqual([["pictureMcq", 5, 0], ["matchToPool", 5, 8], ["matchToPool", 8, 11], ["completeFromPool", 7, 8]]);
    expect(tasks("writing")).toEqual([["form", 1, 0], ["short_text", 1, 0]]);
    expect(tasks("speaking")).toEqual([["monologue", 1, 0], ["monologue", 1, 0], ["conversation", 1, 0]]);
    expect(REAL.sections.find((s) => s.id === "listening")!.playsPerRecording).toBe(2);
  });

  test("the pass rule is two groups of 30/50 — never one total; no negative marking", () => {
    expect(REAL.passRule.groups.map((g) => [g.sections, g.min])).toEqual([
      [["reading", "writing"], 30],
      [["listening", "speaking"], 30],
    ]);
    expect(REAL.scoring.negativeMarking).toBe(false);
  });

  test("word bands of the stimuli and answers", () => {
    for (const form of ["a", "b"]) {
      const text = (id: string) => REFS.readings.get(id) ?? REFS.clips.get(id)!;
      const t1 = text(ex(itemOf(REAL, form, "reading", "t1")).readingId!).texts[0];
      expect(wordCount(t1)).toBeGreaterThanOrEqual(150);
      expect(wordCount(t1)).toBeLessThanOrEqual(175);
      const t4 = text(ex(itemOf(REAL, form, "reading", "t4")).readingId!).texts[0];
      expect(wordCount(t4)).toBeGreaterThanOrEqual(175);
      expect(wordCount(t4)).toBeLessThanOrEqual(210);
      for (const block of text(ex(itemOf(REAL, form, "reading", "t2")).readingId!).blocks) {
        expect(wordCount(block)).toBeGreaterThanOrEqual(20);
        expect(wordCount(block)).toBeLessThanOrEqual(30);
      }
      const conv = text(ex(itemOf(REAL, form, "listening", "t4")).clipId!).texts[0];
      expect(wordCount(conv)).toBeGreaterThanOrEqual(160);
      expect(wordCount(conv)).toBeLessThanOrEqual(185);
      const note = ex(itemOf(REAL, form, "writing", "t2")).modelAnswers![0];
      expect(wordCount(note)).toBeGreaterThanOrEqual(30);
      expect(wordCount(note)).toBeLessThanOrEqual(40);
    }
  });

  test("picture items show three pictures; the last reading T1 item is a picture item", () => {
    for (const form of ["a", "b"]) {
      for (let n = 1; n <= 5; n++) expect(ex(itemOf(REAL, form, "listening", "t1", n)).options.every((o) => o.emoji)).toBe(true);
      expect(ex(itemOf(REAL, form, "reading", "t1", 5)).options.every((o) => o.emoji)).toBe(true);
    }
  });

  test("exam items are scored-bank items: the speech, writing and interaction banks see them", () => {
    const [bank] = examBankDocuments("es");
    expect(bank.exerciseNativeCode).toBe("vi");
    expect(bank.items.length).toBe(REAL.items.length);
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

  test("pool tasks share one pool and never key the same option twice", () => {
    const t = clone();
    ex(itemOf(t, "a", "reading", "t2", 2)).correct = ex(itemOf(t, "a", "reading", "t2", 1)).correct;
    expect(errorsOf(t)).toContain("reuses a pool option as the key of two items");
    const u = clone();
    ex(itemOf(u, "a", "reading", "t2", 2)).options[0] = { text: "Văn bản Z" };
    expect(errorsOf(u)).toContain("must share one pool");
  });

  test("a pool item offers the whole pool", () => {
    const t = clone();
    ex(itemOf(t, "a", "listening", "t3", 1)).options.pop();
    expect(errorsOf(t)).toContain("offer the task's whole pool (11 options)");
  });

  test("picture items need pictures; mcq3 items exactly three options", () => {
    const t = clone();
    delete ex(itemOf(t, "a", "listening", "t1", 1)).options[0].emoji;
    expect(errorsOf(t)).toContain("every option needs an emoji");
    const u = clone();
    ex(itemOf(u, "a", "reading", "t4", 1)).options.push({ text: "Toledo" });
    expect(errorsOf(u)).toContain("offer exactly 3 options");
  });

  test("stimulus and answer word bands are enforced", () => {
    const refs: ExamRefs = { ...REFS, readings: new Map(REFS.readings) };
    const id = ex(itemOf(REAL, "a", "reading", "t1")).readingId!;
    refs.readings.set(id, { ...refs.readings.get(id)!, texts: ["Hola, Marta. Estoy en Sevilla."] });
    expect(errorsOf(clone(), refs)).toContain("outside the format's 150–175");
    const t = clone();
    ex(itemOf(t, "a", "writing", "t2")).modelAnswers = ["Hola, Carmen."];
    expect(errorsOf(t)).toContain("outside the format's 30–40");
  });

  test("listening recordings play as often as the section says, and only exam recordings are used", () => {
    const refs: ExamRefs = { ...REFS, clips: new Map(REFS.clips) };
    const id = ex(itemOf(REAL, "a", "listening", "t1")).clipId!;
    refs.clips.set(id, { ...refs.clips.get(id)!, maxPlays: 1 });
    expect(errorsOf(clone(), refs)).toContain("plays 1× — the section plays each recording 2×");
    refs.clips.set(id, { ...refs.clips.get(id)!, maxPlays: 2, use: undefined });
    expect(errorsOf(clone(), refs)).toContain('is not an exam stimulus (use: "exam")');
  });

  test("results may never claim a pass; readiness says ESTIMATE", () => {
    const t = clone();
    t.readiness.bands[0].message = { vi: "Bạn sẽ đỗ kỳ thi này." };
    expect(errorsOf(t)).toContain('claims a result: "sẽ đỗ"');
    const u = clone();
    u.readiness.bands[0].label = { vi: "Sẵn sàng" };
    expect(errorsOf(u)).toContain("must say it is an estimate");
  });

  test("bands are strictly decreasing and end at 0", () => {
    const t = clone();
    t.readiness.bands[2].minGroupShare = 0.1;
    expect(errorsOf(t)).toContain("the last readiness band must start at minGroupShare 0");
    const u = clone();
    u.readiness.bands[1].minGroupShare = 0.8;
    expect(errorsOf(u)).toContain("strictly decreasing");
  });

  test("pass-rule groups cover every section once and their minimum is reachable", () => {
    const t = clone();
    t.passRule.groups[1].sections = ["listening"];
    expect(errorsOf(t)).toContain("section speaking belongs to no pass-rule group");
    t.passRule.groups[1].min = 40;
    expect(errorsOf(t)).toContain("min 40 exceeds the group's maximum (25)");
  });

  test("a checked format names who checked, when, and the documents read (P3f)", () => {
    expect(errorsOf(clone())).not.toContain("checkedAgainstOfficialGuide");
    const noDates = clone();
    noDates.formatSource.references = noDates.formatSource.references.map(({ url, title }) => ({ url, title }));
    expect(errorsOf(noDates)).toContain("needs a retrieval date on the document(s) actually read");
    const noWho = clone();
    delete noWho.formatSource.checkedBy;
    expect(errorsOf(noWho)).toContain("needs checkedBy and checkedAt");
  });

  test("objective targets resolve; native text is complete", () => {
    const t = clone();
    t.items[0].objectiveTargets = ["es.obj.reading.nope"];
    expect(errorsOf(t)).toContain("unknown objective es.obj.reading.nope");
    const errors = validateExamTrackData({ track: clone(), lang: "es", pack, refs: REFS, nativeCodes: ["vi", "ja"] }).errors.join("\n");
    expect(errors).toContain('missing "ja" text');
  });
});

describe("compiled exam artifact", () => {
  test("es-vi ships the DELE A1 track with its pass rule, native text resolved and weak-area lexemes", () => {
    const artifact = readJson("src/content/exam/es-exam-tracks.json") as { tracks: { id: string; title: string; passRule: { groups: { min: number; max: number }[] }; items: { lexemeRefs: string[] }[]; forms: unknown[] }[] };
    const [track] = artifact.tracks;
    expect(track.id).toBe("es.exam.dele_a1");
    expect(typeof track.title).toBe("string");
    expect(track.passRule.groups.map((g) => [g.min, g.max])).toEqual([[30, 50], [30, 50]]);
    expect(track.items.length).toBe(REAL.items.length);
    expect(track.items.some((i) => i.lexemeRefs.length > 0)).toBe(true);
    expect(track.forms.length).toBe(2);
  });
});
