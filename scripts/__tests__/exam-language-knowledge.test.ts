/**
 * Exam engine, language-knowledge additions (P4c session 5, JLPT N5; reusable for HSK and TOPIK):
 *  - mcq4: one question, exactly four options (the JLPT FAQ: "選択枝の数はほとんど4つ");
 *  - a task's own skill inside a combined section (言語知識（文法）・読解 is one timed section holding grammar and
 *    reading tasks), allowed only in a reading or structures section;
 *  - item lexemeRefs: the words a vocabulary or grammar item tests, which no stimulus names, feed the weak-area
 *    practice; every id must be a lexeme of the target;
 *  - select.scriptAid "hidden": a kanji-reading item shows no furigana or romaji line (it asks for the reading).
 * Built on the DELE A1 track, which the other tests pin; nothing here changes a shipped track.
 */
import { describe, expect, test } from "bun:test";

import { SelectExerciseSchema, examTrackSchema, type ExamTrack } from "../../content/schema";
import { compileExamTracksArtifact, loadExamTracks, validateExamTrackData, type ExamRefs } from "../lib/exam";
import { loadPacks, readJson } from "../lib/pipeline";

const [REAL] = loadExamTracks("es");
const pack = loadPacks().find((p) => p.courseId === "es-vi")!.pack;
const doc = <T>(rel: string, key: string) => ((readJson(rel) as Record<string, T[]>)[key] ?? []) as T[];
const ids = (rel: string, key: string) => new Set(doc<{ id: string }>(rel, key).map((r) => r.id));
type Reading = { id: string; blocks: { text: string }[]; use?: string };
type Clip = { id: string; segments: { text: string }[]; scoredPlaybackPolicy: { maxPlays: number }; use?: string };
const LEXEMES = new Set(Object.values(readJson("content/es/lexemes.json") as Record<string, string>));
const REFS: ExamRefs = {
  objectiveIds: ids("content/es/assessment/objectives.json", "objectives"),
  readings: new Map(doc<Reading>("content/es/reception/reading.json", "readings").map((r) => [r.id, { texts: [r.blocks.map((b) => b.text).join(" ")], blocks: r.blocks.map((b) => b.text), use: r.use }])),
  clips: new Map(doc<Clip>("content/es/reception/listening.json", "clips").map((c) => [c.id, { texts: [c.segments.map((s) => s.text).join(" ")], blocks: c.segments.map((s) => s.text), maxPlays: c.scoredPlaybackPolicy.maxPlays, use: c.use }])),
  speechIds: ids("content/es/speech/items.json", "items"),
  writingIds: ids("content/es/writing/tasks.json", "tasks"),
  scenarioIds: ids("content/es/interaction/scenarios.json", "scenarios"),
  lexemeIds: LEXEMES,
};
const clone = (): ExamTrack => JSON.parse(JSON.stringify(REAL)) as ExamTrack;
const errorsOf = (track: ExamTrack, refs: ExamRefs = REFS) => validateExamTrackData({ track, lang: "es", pack, refs, nativeCodes: ["vi"] }).errors.join("\n");
type Options = { text: string }[];
const reading = (t: ExamTrack) => t.sections.find((s) => s.id === "reading")!;
const itemsOf = (t: ExamTrack, section: string, task: string) => t.items.filter((i) => i.sectionId === section && i.taskId === task);
const opts = (i: { exercise: unknown }) => (i.exercise as { options: Options }).options;

describe("mcq4 (JLPT: four options)", () => {
  test("is a public task format the schema accepts", () => {
    const t = clone();
    reading(t).tasks.find((k) => k.id === "t4")!.format = "mcq4";
    expect(() => examTrackSchema("es").parse(t)).not.toThrow();
  });

  test("an mcq4 item offers exactly four options", () => {
    const t = clone();
    reading(t).tasks.find((k) => k.id === "t4")!.format = "mcq4";
    expect(errorsOf(t)).toContain("mcq4 items offer exactly 4 options");
    for (const item of itemsOf(t, "reading", "t4")) opts(item).push({ text: `Opción ${item.id}` });
    expect(errorsOf(t)).not.toContain("mcq4 items offer exactly 4 options");
    expect(errorsOf(t)).toBe("");
  });
});

describe("a task's own skill inside a combined section (言語知識（文法）・読解)", () => {
  test("a structures section rejects reading items unless the task says it is a reading task", () => {
    const t = clone();
    reading(t).skill = "structures";
    expect(errorsOf(t)).toContain("readingComprehension cannot assess structures");
    for (const task of reading(t).tasks) task.skill = "reading";
    expect(errorsOf(t)).toBe("");
  });

  test("only reading and structures sections hold tasks of another skill", () => {
    const t = clone();
    t.sections.find((s) => s.id === "listening")!.tasks[0].skill = "reading";
    expect(errorsOf(t)).toContain("a task's own skill applies only inside a reading or structures section");
    const u = clone();
    expect(() => examTrackSchema("es").parse({ ...u, sections: u.sections.map((s) => (s.id === "reading" ? { ...s, tasks: s.tasks.map((k) => ({ ...k, skill: "speaking" })) } : s)) })).toThrow();
  });
});

describe("item lexemeRefs (weak areas of a language-knowledge item)", () => {
  test("every id is a lexeme of the target", () => {
    const t = clone();
    const known = [...LEXEMES][0]!;
    t.items[0].lexemeRefs = [known];
    expect(errorsOf(t)).toBe("");
    t.items[0].lexemeRefs = [known, "es:w:zz-not-a-word"];
    expect(errorsOf(t)).toContain("unknown lexeme es:w:zz-not-a-word");
  });

  test("the compiled item exercises its own lexemes and its stimulus's, sorted, once", () => {
    const t = clone();
    const [a, b] = [...LEXEMES].sort();
    t.items[0].lexemeRefs = [b!, a!];
    const empty = { readings: new Map<string, string[]>(), clips: new Map<string, string[]>(), speech: new Map<string, string[]>(), writing: new Map<string, string[]>() };
    const compiled = JSON.parse(compileExamTracksArtifact([t], "es", "vi", empty)) as { tracks: { items: { lexemeRefs: string[] }[] }[] };
    expect(compiled.tracks[0]!.items[0]!.lexemeRefs).toEqual([a, b]);
    const withStimulus = { ...empty, readings: new Map([[(t.items[0].exercise as { readingId?: string }).readingId ?? "", [a!]]]) };
    const again = JSON.parse(compileExamTracksArtifact([t], "es", "vi", withStimulus)) as { tracks: { items: { lexemeRefs: string[] }[] }[] };
    expect(again.tracks[0]!.items[0]!.lexemeRefs).toEqual([a, b]);
  });
});

describe("select.scriptAid (a kanji-reading item hides furigana and romaji)", () => {
  const base = { type: "select", id: "x-1", mode: "nativeToTarget", prompt: "p", options: [{ text: "a" }, { text: "b" }], correct: 0 };
  test("hidden is the one value", () => {
    expect(SelectExerciseSchema.parse({ ...base, scriptAid: "hidden" }).scriptAid).toBe("hidden");
    expect(() => SelectExerciseSchema.parse({ ...base, scriptAid: "shown" })).toThrow();
    expect(SelectExerciseSchema.parse(base).scriptAid).toBeUndefined();
  });
});
