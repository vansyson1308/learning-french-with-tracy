import { describe, expect, test } from "bun:test";

import { deriveObjectiveStates } from "../assessment/states";
import type { AssessmentItemResult } from "../assessment/types";
import { courseProfile, hasCapability } from "../course-profile";
import { examTrackFor, examTracksFor } from "../exam/content";
import {
  buildExamAttempt,
  buildExamSectionSession,
  examAttemptId,
  examRuleChecks,
  examWeakAreas,
  isExamAttemptOf,
  itemResultsFor,
  playsForTask,
  scoreExam,
  secondsLeft,
  sectionItems,
  selectMockForm,
  type CompiledExamTrack,
} from "../exam/engine";
import { buildWeakAreaSessionDefinition } from "../session/sources";
import { useCourseContent } from "../content";

const TRACK = examTrackFor("es-vi", "es.exam.dele_a1") as CompiledExamTrack;
const formItems = (formId: string) => TRACK.forms.find((f) => f.formId === formId)!.itemIds;
const results = (ids: readonly string[], correct: (id: string, i: number) => boolean | null): AssessmentItemResult[] => ids.map((itemId, i) => ({ itemId, correct: correct(itemId, i) }));
const sectionOf = (id: string) => TRACK.items.find((i) => i.id === id)!.sectionId;

describe("exam track availability (P3d)", () => {
  test("es-vi has the DELE A1 track; French and es-en have none", () => {
    expect(examTracksFor("es-vi").map((t) => t.id)).toEqual(["es.exam.dele_a1"]);
    expect(hasCapability("es-vi", "exam")).toBe(true);
    expect(hasCapability("fr-en", "exam")).toBe(false);
    expect(hasCapability("es-en", "exam")).toBe(false);
    expect(examTracksFor("fr-en")).toEqual([]);
    expect(courseProfile("es-en").role).toBe("standalone");
    expect(courseProfile("es-vi").role).toBeUndefined();
  });

  test("native text is resolved to Vietnamese for es-vi", () => {
    expect(TRACK.title).toBe("Luyện thi DELE A1");
    expect(TRACK.readiness.disclaimer).toContain("ước tính");
  });
});

describe("forms and sessions", () => {
  test("mock sittings rotate a → b → a", () => {
    expect([0, 1, 2].map((n) => selectMockForm(TRACK, n).formId)).toEqual(["a", "b", "a"]);
  });

  test("a form administers 25 reading and 25 listening items, task order kept (2020 model)", () => {
    expect(sectionItems(TRACK, "reading", "a").length).toBe(25);
    expect(sectionItems(TRACK, "listening", "b").length).toBe(25);
    expect(sectionItems(TRACK, "writing", "a").length).toBe(2);
    expect(sectionItems(TRACK, "speaking", "a").map((i) => i.taskId)).toEqual(["t1", "t2", "t3"]);
    const tasks = sectionItems(TRACK, "reading", "a").map((i) => i.taskId);
    expect(tasks).toEqual([...tasks].sort());
    expect(sectionItems(TRACK, "reading", null).length).toBe(50);
  });

  test("mock sessions are scored with minimal feedback; practice shows full feedback; neither records by itself", () => {
    const mock = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "reading", formId: "a", mode: "mock", attemptSeed: 0 });
    expect(mock.kind).toBe("checkpoint");
    expect(mock.completion).toBe("exam");
    expect(mock.retryPolicy).toBe("none");
    expect(mock.feedbackPolicy).toBe("minimal");
    expect(mock.steps.length).toBe(25);
    const practice = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "reading", formId: null, mode: "practice", attemptSeed: 0 });
    expect(practice.feedbackPolicy).toBe("full");
    expect(practice.steps.length).toBe(50);
  });

  test("a lettered pool keeps its order in every sitting (the letters are the answer sheet)", () => {
    const a = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "listening", formId: "a", mode: "mock", attemptSeed: 0 });
    const b = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "listening", formId: "a", mode: "mock", attemptSeed: 5 });
    const poolSteps = (d: typeof a) =>
      d.steps.filter((s) => s.type === "exercise" && TRACK.items.find((i) => i.id === s.stepId)!.taskId !== "t1").map((s) => (s.type === "exercise" ? JSON.stringify(s.exercise) : ""));
    expect(poolSteps(a)).toEqual(poolSteps(b));
    const original = sectionItems(TRACK, "listening", "a").filter((i) => i.taskId !== "t1").map((i) => JSON.stringify(i.exercise));
    expect(poolSteps(a)).toEqual(original);
  });

  test("the group rule, not the total, decides: 50 + 20 is not 'ready' even with 70/100", () => {
    const ids = formItems("a");
    const counter: Record<string, number> = {};
    const r = results(ids, (id) => {
      const s = sectionOf(id);
      counter[s] = (counter[s] ?? 0) + 1;
      if (s === "reading" || s === "writing") return true;
      if (s === "listening") return counter[s] <= 20;
      return false;
    });
    const score = scoreExam(TRACK, r);
    expect(score.groups.map((g) => g.points)).toEqual([50, 20]);
    expect(score.groups.map((g) => g.reachesThreshold)).toEqual([true, false]);
    expect(score.band?.id).toBe("not_yet");
  });

  test("scored options are reshuffled per sitting, the answer key follows", () => {
    const a = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "reading", formId: "a", mode: "mock", attemptSeed: 0 });
    const b = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "reading", formId: "a", mode: "mock", attemptSeed: 1 });
    const orders = (d: typeof a) => d.steps.map((s) => (s.type === "exercise" && "options" in s.exercise ? JSON.stringify(s.exercise.options) : ""));
    expect(orders(a)).not.toEqual(orders(b));
    for (const s of a.steps) {
      if (s.type !== "exercise" || s.exercise.type !== "readingComprehension") continue;
      const source = TRACK.items.find((i) => i.id === s.stepId)!.exercise as typeof s.exercise;
      expect(s.exercise.options[s.exercise.correct].text).toBe(source.options[source.correct].text);
    }
  });
});

describe("scoring and estimated readiness", () => {
  test("all correct: 25 per section, 50 per group, the top band", () => {
    const score = scoreExam(TRACK, results(formItems("a"), () => true));
    expect(score.sections.map((s) => s.points)).toEqual([25, 25, 25, 25]);
    expect(score.groups.map((g) => [g.points, g.max, g.min, g.reachesThreshold])).toEqual([[50, 50, 30, true], [50, 50, 30, true]]);
    expect(score.band?.id).toBe("ready_estimate");
  });

  test("nothing correct: no points, the lowest band", () => {
    const score = scoreExam(TRACK, results(formItems("a"), () => false));
    expect(score.groups.map((g) => g.points)).toEqual([0, 0]);
    expect(score.band?.id).toBe("not_yet");
  });

  test("the weaker group decides the band (60% everywhere = at the threshold, no margin)", () => {
    // 15 of 25 reading, 15 of 25 listening; writing / speaking: all correct vs none.
    const ids = formItems("a");
    const counter: Record<string, number> = {};
    const r = results(ids, (id) => {
      const s = sectionOf(id);
      counter[s] = (counter[s] ?? 0) + 1;
      if (s === "reading" || s === "listening") return counter[s] <= 15;
      return s === "writing" ? true : false;
    });
    const score = scoreExam(TRACK, r);
    expect(score.sections.map((s) => s.points)).toEqual([15, 15, 25, 0]);
    expect(score.groups.map((g) => g.points)).toEqual([40, 15]);
    expect(score.band?.id).toBe("not_yet");
  });

  test("a skipped section (no speech device) makes the sitting incomplete: no band at all", () => {
    const ids = formItems("a").filter((id) => sectionOf(id) !== "speaking");
    const score = scoreExam(TRACK, results(ids, () => true));
    expect(score.complete).toBe(false);
    expect(score.band).toBeNull();
    expect(score.groups.find((g) => g.id === "group_2")!.points).toBeNull();
    expect(score.groups.find((g) => g.id === "group_1")!.points).toBe(50);
  });

  test("task points weight a section (Goethe Schreiben: Teil 1 5 points, Teil 2 10 points)", () => {
    const track = JSON.parse(JSON.stringify(TRACK)) as CompiledExamTrack;
    const writing = track.sections.find((s) => s.id === "writing")!;
    writing.tasks.find((t) => t.id === "t1")!.points = 5;
    writing.tasks.find((t) => t.id === "t2")!.points = 10;
    const ids = sectionItems(track, "writing", "a").map((i) => i.id);
    const taskOf = (id: string) => track.items.find((i) => i.id === id)!.taskId;
    const score = scoreExam(track, results(ids, (id) => taskOf(id) === "t1"));
    expect(score.sections.find((s) => s.id === "writing")!.points).toBe(8.3);
    // Without task points every item weighs the same (DELE): 1 of 2 items → half.
    expect(scoreExam(TRACK, results(ids, (id) => taskOf(id) === "t1")).sections.find((s) => s.id === "writing")!.points).toBe(12.5);
  });

  test("a rubric credit scores a message part in points (Goethe Teil 2: 8 of 10), not all-or-nothing (QC 2026-10-29 §1.5)", () => {
    const track = JSON.parse(JSON.stringify(TRACK)) as CompiledExamTrack;
    const writing = track.sections.find((s) => s.id === "writing")!;
    writing.tasks.find((t) => t.id === "t1")!.points = 5;
    writing.tasks.find((t) => t.id === "t2")!.points = 10;
    const ids = sectionItems(track, "writing", "a").map((i) => i.id);
    const taskOf = (id: string) => track.items.find((i) => i.id === id)!.taskId;
    const rows = itemResultsFor(ids, Object.fromEntries(ids.map((id) => [id, taskOf(id) === "t1"])), Object.fromEntries(ids.filter((id) => taskOf(id) === "t2").map((id) => [id, 0.8])));
    expect(rows.filter((r) => r.credit !== undefined).map((r) => r.credit)).toEqual([0.8]);
    // (5 + 0.8 × 10) / 15 of the section's 25 points.
    expect(scoreExam(track, rows).sections.find((s) => s.id === "writing")!.points).toBe(21.7);
    // Without a credit the item stays all-or-nothing, as before (DELE results unchanged).
    expect(itemResultsFor(ids, Object.fromEntries(ids.map((id) => [id, true]))).every((r) => !("credit" in r))).toBe(true);
  });

  test("a points-weighted short_text part carries its rubric spec on the session step; DELE's do not", () => {
    const track = JSON.parse(JSON.stringify(TRACK)) as CompiledExamTrack;
    const writing = track.sections.find((s) => s.id === "writing")!;
    writing.tasks.find((t) => t.id === "t1")!.points = 5;
    writing.tasks.find((t) => t.id === "t2")!.points = 10;
    const specOf = (tr: CompiledExamTrack) =>
      buildExamSectionSession({ courseId: "es-vi", track: tr, sectionId: "writing", formId: "a", mode: "mock", attemptSeed: 0 }).steps.map((s) => (s.type === "exercise" ? s.writingPoints?.maxPoints ?? null : null));
    expect(specOf(track)).toEqual([null, 10]);
    expect(specOf(TRACK)).toEqual([null, null]);
  });

  test("two-option items (mcq2: richtig/falsch, a/b) keep their order in every sitting", () => {
    const track = JSON.parse(JSON.stringify(TRACK)) as CompiledExamTrack;
    track.sections.find((s) => s.id === "reading")!.tasks.find((t) => t.id === "t1")!.format = "mcq2";
    const sitting = (seed: number) =>
      buildExamSectionSession({ courseId: "es-vi", track, sectionId: "reading", formId: "a", mode: "mock", attemptSeed: seed })
        .steps.filter((s) => s.type === "exercise" && track.items.find((i) => i.id === s.stepId)!.taskId === "t1")
        .map((s) => (s.type === "exercise" ? JSON.stringify(s.exercise) : ""));
    expect(sitting(0)).toEqual(sectionItems(track, "reading", "a").filter((i) => i.taskId === "t1").map((i) => JSON.stringify(i.exercise)));
    expect(sitting(7)).toEqual(sitting(0));
  });

  test("each Goethe Hören Teil plays as often as the format says: Teil 1 and 3 twice, Teil 2 once (QC 2026-10-29 §1.4)", () => {
    const goethe = examTrackFor("de-vi", "de.exam.goethe_a1") as CompiledExamTrack;
    const hoeren = goethe.sections.find((s) => s.skill === "listening")!;
    expect(hoeren.tasks.map((t) => [t.id, playsForTask(hoeren, t.id)])).toEqual([["t1", 2], ["t2", 1], ["t3", 2]]);
    for (const mode of ["mock", "practice"] as const) {
      const session = buildExamSectionSession({ courseId: "de-vi", track: goethe, sectionId: hoeren.id, formId: "a", mode, attemptSeed: 0 });
      const playsByTask = new Map<string, Set<number | undefined>>();
      for (const s of session.steps) {
        if (s.type !== "exercise") continue;
        const task = goethe.items.find((i) => i.id === s.stepId)!.taskId;
        playsByTask.set(task, new Set([...(playsByTask.get(task) ?? []), s.maxPlays]));
      }
      expect([...playsByTask].map(([t, p]) => [t, [...p]])).toEqual([["t1", [2]], ["t2", [1]], ["t3", [2]]]);
    }
  });

  test("a section without per-part counts keeps its own count (DELE: twice); other sections set none", () => {
    const listening = TRACK.sections.find((s) => s.skill === "listening")!;
    expect(listening.tasks.every((t) => playsForTask(listening, t.id) === listening.playsPerRecording)).toBe(true);
    const reading = buildExamSectionSession({ courseId: "es-vi", track: TRACK, sectionId: "reading", formId: "a", mode: "mock", attemptSeed: 0 });
    expect(reading.steps.every((s) => s.type !== "exercise" || s.maxPlays === undefined)).toBe(true);
  });

  test("time-up items are null and count as not answered", () => {
    const ids = sectionItems(TRACK, "listening", "a").map((i) => i.id);
    const r = itemResultsFor(ids, { [ids[0]]: true });
    expect(r.filter((x) => x.correct === null).length).toBe(24);
    expect(scoreExam(TRACK, r).sections.find((s) => s.id === "listening")!.points).toBe(1);
  });
});

describe("attempts, weak areas and FSRS isolation", () => {
  test("an exam attempt is a CheckpointAttempt under the track id with no objective verdicts", () => {
    const attempt = buildExamAttempt({ track: TRACK, mode: "mock", formId: "a", itemResults: results(formItems("a"), () => false), startedAt: 1, completedAt: 2 });
    expect(attempt.checkpointId).toBe(examAttemptId(TRACK.id, "mock"));
    expect(isExamAttemptOf(attempt, TRACK.id)).toBe(true);
    expect(attempt.objectiveResults).toEqual([]);
    expect(attempt.formId).toBe("a");
    expect(examAttemptId(TRACK.id, "practice", "reading")).toBe("es.exam.dele_a1#practice:reading");
  });

  test("exam attempts never move the CEFR objective states", () => {
    const base = { objectiveIds: ["es.obj.reading.short_messages"], objectiveLessons: {}, completedLessons: {} };
    const attempt = buildExamAttempt({ track: TRACK, mode: "mock", formId: "a", itemResults: results(formItems("a"), () => false), startedAt: 1, completedAt: 2 });
    expect(deriveObjectiveStates({ ...base, checkpointAttempts: [attempt] })).toEqual(deriveObjectiveStates({ ...base, checkpointAttempts: [] }));
  });

  test("weak areas list missed tasks worst-first and the lexemes they exercise", () => {
    const ids = formItems("a");
    const weak = examWeakAreas(TRACK, results(ids, (id) => sectionOf(id) !== "reading"));
    expect(weak.tasks.every((t) => t.sectionId === "reading")).toBe(true);
    expect(weak.tasks.map((t) => t.taskId).sort()).toEqual(["t1", "t2", "t3", "t4"]);
    expect(weak.lexemeIds.length).toBeGreaterThan(0);
    expect(weak.lexemeIds.every((l) => l.startsWith("es:w:"))).toBe(true);
    expect(examWeakAreas(TRACK, results(ids, () => true)).tasks).toEqual([]);
  });

  test("weak-area practice is an ordinary FSRS review over the missed lexemes", () => {
    const weak = examWeakAreas(TRACK, results(formItems("a"), () => false));
    const { allWords } = useCourseContent("es-vi");
    const def = buildWeakAreaSessionDefinition({ courseId: "es-vi", lexemeIds: weak.lexemeIds, pool: allWords(), seed: 1 });
    expect(def.kind).toBe("review");
    expect(def.completion).toBe("practice");
    expect(def.steps.length).toBeGreaterThan(0);
    for (const step of def.steps) {
      if (step.type === "exercise" && step.evidence) expect(step.evidence.itemId.startsWith("es:w:")).toBe(true);
    }
    expect(buildWeakAreaSessionDefinition({ courseId: "es-vi", lexemeIds: [], pool: allWords(), seed: 1 }).steps).toEqual([]);
  });

  test("the section clock never goes negative", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_000, 9_001)).toBe(1);
    expect(secondsLeft(10_000, 20_000)).toBe(0);
  });
});

/**
 * exam-engine-v2 (QC 2026-10-29 §2): a CILS-shaped track — five sections of
 * 12 points (the fifth is language structures), each ≥ 7, total ≥ 35/60,
 * every part taken. One point per item keeps the arithmetic visible.
 */
const CILS_SECTIONS = ["listening", "reading", "structures", "writing", "speaking"] as const;
function cilsTrack(): CompiledExamTrack {
  const sections = CILS_SECTIONS.map((id) => ({
    id,
    skill: id,
    title: `Parte ${id}`,
    minutes: 30,
    maxPoints: 12,
    tasks: [{ id: "t1", title: "t1", instruction: "", format: id === "structures" ? "cloze" : "mcq3", itemsPerForm: 12 }],
  }));
  const items = CILS_SECTIONS.flatMap((sectionId) =>
    Array.from({ length: 12 }, (_, n) => ({ id: `it.exi.cils_a1.${sectionId}_${n}`, itemVersion: 1, sectionId, taskId: "t1", exercise: { type: "select" } as never, objectiveTargets: [`it.obj.${sectionId}`], lexemeRefs: [] }))
  );
  return {
    ...TRACK,
    id: "it.exam.cils_a1",
    sections,
    passRule: {
      groups: [],
      sectionMinimums: CILS_SECTIONS.map((sectionId) => ({ sectionId, min: 7, max: 12 })),
      total: { title: "Totale", min: 35, max: 60 },
      everySectionTaken: true,
    },
    items,
    forms: [{ formId: "a", itemIds: items.map((i) => i.id) }],
  };
}
/** Results with `points[section]` correct items out of 12; a section missing from `points` is not taken. */
function cilsResults(points: Partial<Record<(typeof CILS_SECTIONS)[number], number>>): AssessmentItemResult[] {
  return Object.entries(points).flatMap(([sectionId, k]) => Array.from({ length: 12 }, (_, n) => ({ itemId: `it.exi.cils_a1.${sectionId}_${n}`, correct: n < (k as number) })));
}

describe("exam-engine-v2: any combination of pass rules (CILS)", () => {
  const track = cilsTrack();

  test("every section at its minimum and the total at 35: every rule met, a band is given", () => {
    const score = scoreExam(track, cilsResults({ listening: 7, reading: 7, structures: 7, writing: 7, speaking: 7 }));
    const checks = examRuleChecks(track, score);
    expect(score.complete).toBe(true);
    expect(checks.map((c) => `${c.kind}:${c.id}:${c.points}/${c.max}≥${c.min}:${c.met}`)).toEqual([
      "section:listening:7/12≥7:true",
      "section:reading:7/12≥7:true",
      "section:structures:7/12≥7:true",
      "section:writing:7/12≥7:true",
      "section:speaking:7/12≥7:true",
      "total:total:35/60≥35:true",
    ]);
    expect(score.band).not.toBeNull();
  });

  test("total ≥ 35 but one section at 6: that section's rule is not met, and the band follows the weakest rule", () => {
    const strong = scoreExam(track, cilsResults({ listening: 6, reading: 12, structures: 12, writing: 12, speaking: 12 }));
    const missed = examRuleChecks(track, strong).filter((c) => c.met === false);
    expect(missed.map((c) => `${c.title}: ${c.points}/${c.max} — ≥ ${c.min}`)).toEqual(["Parte listening: 6/12 — ≥ 7"]);
    expect(examRuleChecks(track, strong).find((c) => c.kind === "total")?.met).toBe(true);
    // The weakest share is 6/12, not the 54/60 total.
    const allHalf = scoreExam(track, cilsResults({ listening: 6, reading: 6, structures: 6, writing: 6, speaking: 6 }));
    expect(strong.band?.id).toBe(allHalf.band?.id);
  });

  test("one section at 6 and the rest at 7: that section and the total (34/60) are both listed", () => {
    const score = scoreExam(track, cilsResults({ listening: 7, reading: 7, structures: 7, writing: 7, speaking: 6 }));
    const missed = examRuleChecks(track, score).filter((c) => c.met === false).map((c) => c.id);
    expect(missed).toEqual(["speaking", "total"]);
  });

  test("a section not taken: incomplete, no band, the total and that section unmeasured", () => {
    const score = scoreExam(track, cilsResults({ listening: 12, reading: 12, structures: 12, writing: 12 }));
    const checks = examRuleChecks(track, score);
    expect(score.complete).toBe(false);
    expect(score.band).toBeNull();
    expect(checks.filter((c) => c.points === null).map((c) => c.id)).toEqual(["speaking", "total"]);
    expect(checks.some((c) => c.met === false)).toBe(false);
  });

  test("everySectionTaken holds a sitting incomplete even when every declared minimum is measured", () => {
    const t = cilsTrack();
    t.passRule = { groups: [{ id: "g", title: "g", sections: ["listening", "reading", "structures", "writing"], min: 28, max: 48 }], everySectionTaken: true };
    const score = scoreExam(t, cilsResults({ listening: 12, reading: 12, structures: 12, writing: 12 }));
    expect(score.groups[0].reachesThreshold).toBe(true);
    expect(score.complete).toBe(false);
    expect(score.band).toBeNull();
    delete t.passRule.everySectionTaken;
    expect(scoreExam(t, cilsResults({ listening: 12, reading: 12, structures: 12, writing: 12 })).complete).toBe(true);
  });

  test("DELE keeps its two group checks and nothing else", () => {
    const score = scoreExam(TRACK, []);
    expect(examRuleChecks(TRACK, score).map((c) => `${c.kind}:${c.id}`)).toEqual(["group:group_1", "group:group_2"]);
  });
});
