import { describe, expect, test } from "bun:test";

import { deriveObjectiveStates } from "../assessment/states";
import type { AssessmentItemResult } from "../assessment/types";
import { courseProfile, hasCapability } from "../course-profile";
import { examTrackFor, examTracksFor } from "../exam/content";
import {
  buildExamAttempt,
  buildExamSectionSession,
  examAttemptId,
  examWeakAreas,
  isExamAttemptOf,
  itemResultsFor,
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
