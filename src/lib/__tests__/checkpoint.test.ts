/**
 * Checkpoint engine (§147): no retry in scored sessions, first-attempt
 * scoring, no FSRS/wordStats/mistakes/XP mutation, attempt recording with
 * retention, and the session-definition shape (§104-108).
 */
import { describe, expect, test } from "bun:test";

import { buildCheckpointAttempt, scoreObjectives } from "../assessment/checkpoint";
import { checkpointFor, checkpointForSection, CHECKPOINT_ORDER } from "../assessment/content";
import { evidencePlanFor } from "../session/evidence";
import { emptySessionState, sessionReducer, type SessionMachineState } from "../session/reducer";
import { buildCheckpointSessionDefinition } from "../session/sources";
import type { ExerciseStep, SessionAssessmentPlan, SessionStep } from "../session/types";
import { useProgress } from "../store";

const CP1 = checkpointFor("fr.checkpoint.section-1")!;
const CP2 = checkpointFor("fr.checkpoint.section-2")!;

function start(steps: SessionStep[], retryPolicy: "untilCorrect" | "none"): SessionMachineState {
  return sessionReducer(emptySessionState(), {
    type: "start",
    sessionId: "t",
    steps,
    retryPolicy,
  });
}

function exerciseStep(stepId: string): ExerciseStep {
  return {
    type: "exercise",
    stepId,
    exercise: {
      type: "select",
      id: stepId,
      mode: "targetToNative",
      prompt: "x",
      options: [{ text: "right" }, { text: "wrong" }],
      correct: 0,
    },
  };
}

describe("compiled checkpoints", () => {
  test("all six section checkpoints exist, plus the A1 capstone (P9 §41)", () => {
    expect(CHECKPOINT_ORDER).toEqual([
      "fr.checkpoint.section-1",
      "fr.checkpoint.section-2",
      "fr.checkpoint.section-3",
      "fr.checkpoint.section-4",
      "fr.checkpoint.section-5",
      "fr.checkpoint.section-6",
      "fr.checkpoint.a1-capstone",
    ]);
    expect(CP1.items.length).toBe(12);
    expect(CP2.items.length).toBe(18);
    expect(CP1.criteria.minItemsPerObjective).toBe(2);
    expect(CP1.criteria.demonstratedShare).toBe(0.66); // 2-of-3 demonstrates — product-local, not a CEFR cut score
  });

  test("Section-6 checkpoint: 6 reserved multi-turn interaction scenarios (P9 §35-§37)", () => {
    const cp6 = checkpointFor("fr.checkpoint.section-6")!;
    expect(cp6.sectionId).toBe("fr-en:section-6");
    expect(cp6.items.length).toBe(6);
    for (const item of cp6.items) {
      expect(item.exercise.type).toBe("interactionScenario");
      expect(item.essential).toBe(true);
    }
    // 3 scenario items per interaction objective — the claim gate's
    // per-objective floor, each on its own scenario input.
    const perObjective = new Map<string, number>();
    for (const item of cp6.items) {
      for (const o of item.objectiveTargets) {
        perObjective.set(o, (perObjective.get(o) ?? 0) + 1);
      }
    }
    expect(perObjective.get("fr.obj.interaction.everyday_conversation")).toBe(3);
    expect(perObjective.get("fr.obj.interaction.practical_needs")).toBe(3);
    expect(perObjective.size).toBe(2);
  });

  test("A1 capstone: 20 items over five domains, two disjoint forms at the floor (P9 §41-§43)", () => {
    const cap = checkpointFor("fr.checkpoint.a1-capstone")!;
    expect(cap.items.length).toBe(20);
    expect(cap.formVersion).toBe(1);
    expect(cap.forms?.map((f) => f.formId)).toEqual(["a", "b"]);
    // Disjoint 10/10 split covering the whole bank.
    const a = new Set(cap.forms![0].itemIds);
    const b = new Set(cap.forms![1].itemIds);
    expect(a.size).toBe(10);
    expect(b.size).toBe(10);
    expect([...a].filter((id) => b.has(id))).toEqual([]);
    // One representative objective per domain, 4 items each, 2 per form.
    const objectives = new Set(cap.items.flatMap((i) => i.objectiveTargets));
    expect([...objectives].sort()).toEqual([
      "fr.obj.interaction.everyday_conversation",
      "fr.obj.listening.short_info",
      "fr.obj.reading.short_messages",
      "fr.obj.speaking.give_info",
      "fr.obj.writing.short_message",
    ]);
    for (const form of cap.forms!) {
      const perObjective = new Map<string, number>();
      for (const itemId of form.itemIds) {
        const item = cap.items.find((i) => i.id === itemId)!;
        for (const oid of item.objectiveTargets) {
          perObjective.set(oid, (perObjective.get(oid) ?? 0) + 1);
        }
      }
      for (const oid of objectives) {
        expect(perObjective.get(oid)).toBe(2);
      }
    }
    // Sharing section-6's sectionId must not displace the SECTION card:
    // checkpointForSection resolves the section checkpoint, not the capstone.
    expect(checkpointForSection("fr-en:section-6")?.id).toBe("fr.checkpoint.section-6");
  });

  test("Section-4 checkpoint: 12 reserved spoken items, production-only, model-free (P8 §20)", () => {
    const cp4 = checkpointFor("fr.checkpoint.section-4")!;
    expect(cp4.sectionId).toBe("fr-en:section-4");
    expect(cp4.items.length).toBe(12);
    for (const item of cp4.items) {
      expect(item.exercise.type).toBe("speakProduction");
      if (item.exercise.type !== "speakProduction") continue;
      // Scored spoken items never carry a model clip, never allow bias,
      // never reveal the target, and never write speak cards.
      expect(item.exercise.modelClipId).toBeNull();
      expect(item.exercise.allowContextualBias).toBe(false);
      expect(item.exercise.revealTargetAfterAttempts).toBeNull();
      expect(item.exercise.evidenceLexemeRefs).toEqual([]);
    }
    // 3 items per spoken objective — the claim gate's per-objective floor.
    const perObjective = new Map<string, number>();
    for (const item of cp4.items) {
      for (const o of item.objectiveTargets) {
        perObjective.set(o, (perObjective.get(o) ?? 0) + 1);
      }
    }
    expect([...perObjective.values()].every((n) => n === 3)).toBe(true);
    expect(perObjective.size).toBe(4);
  });

  test("Section-5 checkpoint: 12 reserved writing items, guided-only, tri-state honest (P9 §22)", () => {
    const cp5 = checkpointFor("fr.checkpoint.section-5")!;
    expect(cp5.sectionId).toBe("fr-en:section-5");
    expect(cp5.items.length).toBe(12);
    for (const item of cp5.items) {
      const type = item.exercise.type;
      expect(type === "guidedWriting" || type === "simpleForm").toBe(true);
      // Scored writing is GUIDED only — open practice never reaches a bank.
      if (item.exercise.type === "guidedWriting") {
        expect(item.exercise.writingMode).toBe("guided");
      }
    }
    // 3 items per written objective across 2 exercise types + 4 authored
    // task families — the claim gate's per-objective and breadth floors.
    const perObjective = new Map<string, number>();
    for (const item of cp5.items) {
      for (const o of item.objectiveTargets) {
        perObjective.set(o, (perObjective.get(o) ?? 0) + 1);
      }
    }
    expect(perObjective.get("fr.obj.writing.personal_info")).toBe(3);
    expect(perObjective.get("fr.obj.writing.phrases_sentences")).toBe(3);
    expect(perObjective.get("fr.obj.writing.short_message")).toBeGreaterThanOrEqual(3);
    expect(perObjective.get("fr.obj.writing.form_filling")).toBe(3);
  });

  test("Section-3 checkpoint: 22 receptive items, balanced and audio-honest (P7 §101-105)", () => {
    const cp3 = checkpointFor("fr.checkpoint.section-3")!;
    expect(cp3.sectionId).toBe("fr-en:section-3");
    expect(cp3.items.length).toBe(22);
    const types = cp3.items.map((i) => i.exercise.type);
    const count = (t: string) => types.filter((x) => x === t).length;
    // Listening 13 (11 comprehension + 2 dictation) / reading 9 (7
    // comprehension + 2 sign-reading selects): both modalities substantial.
    expect(count("listeningComprehension")).toBe(11);
    expect(count("dictation")).toBe(2);
    expect(count("readingComprehension")).toBe(7);
    expect(count("select")).toBe(2);
    // Scored session over it: exercises only, no retries, no undo.
    const def = buildCheckpointSessionDefinition(cp3);
    expect(def.kind).toBe("checkpoint");
    expect(def.retryPolicy).toBe("none");
    expect(Object.keys(def.assessment!.itemObjectives).length).toBe(22);
  });

  test("the session definition is a scored assessment: exercises only, no retry, no mistakes, no undo", () => {
    const def = buildCheckpointSessionDefinition(CP2);
    expect(def.kind).toBe("checkpoint");
    expect(def.retryPolicy).toBe("none");
    expect(def.completion).toBe("checkpoint");
    expect(def.trackMistakes).toBe(false);
    expect(def.allowUndo).toBe(false);
    expect(def.steps.every((s) => s.type === "exercise")).toBe(true); // §108
    expect(Object.keys(def.assessment!.itemObjectives).length).toBe(18);
  });
});

describe("retry policy none (§55, §105)", () => {
  test("a wrong answer records, does NOT re-queue, and the session still completes fully", () => {
    let state = start([exerciseStep("a"), exerciseStep("b")], "none");
    state = sessionReducer(state, { type: "answer", value: 1 }); // wrong
    state = sessionReducer(state, { type: "check" });
    expect(state.status).toBe("wrong");
    state = sessionReducer(state, { type: "continue" });
    expect(state.queue.length).toBe(2); // no retry appended
    state = sessionReducer(state, { type: "answer", value: 0 });
    state = sessionReducer(state, { type: "check" });
    state = sessionReducer(state, { type: "continue" });
    expect(state.finished).toBe(true);
    expect(state.firstResults).toEqual({ a: false, b: true });
    expect(state.completedCount).toBe(2); // progress reaches 1 despite the miss
  });

  test("learning sessions keep the until-correct re-queue", () => {
    let state = start([exerciseStep("a")], "untilCorrect");
    state = sessionReducer(state, { type: "answer", value: 1 });
    state = sessionReducer(state, { type: "check" });
    state = sessionReducer(state, { type: "continue" });
    expect(state.queue.length).toBe(2); // retry appended
    expect(state.finished).toBe(false);
  });
});

describe("scored sessions emit no learning evidence (§56-58)", () => {
  test("evidencePlanFor is null for checkpoint and placement kinds — even for grammar/select steps", () => {
    const def = buildCheckpointSessionDefinition(CP2);
    for (const step of def.steps) {
      expect(evidencePlanFor(def, step as ExerciseStep)).toBeNull();
    }
    const placementDef = { ...def, kind: "placement" as const };
    expect(evidencePlanFor(placementDef, def.steps[0] as ExerciseStep)).toBeNull();
  });
});

describe("scoring (§61-64)", () => {
  const plan: SessionAssessmentPlan = {
    checkpointId: "fr.checkpoint.test",
    checkpointVersion: 1,
    formId: "full",
    formVersion: 1,
    criteria: { minItemsPerObjective: 2, demonstratedShare: 0.66 },
    itemObjectives: {
      i1: ["fr.obj.a.x"],
      i2: ["fr.obj.a.x"],
      i3: ["fr.obj.a.x"],
      i4: ["fr.obj.b.y"],
      i5: ["fr.obj.b.y"],
      i6: ["fr.obj.c.z"],
    },
  };

  test("demonstrated needs enough items AND enough correct share", () => {
    const results = scoreObjectives(plan, {
      i1: true,
      i2: true,
      i3: false, // 2/3 = 0.667 → demonstrated
      i4: true,
      i5: false, // 1/2 = 0.5 → needs_practice
      i6: true, // 1 item → insufficient_evidence
    });
    expect(results).toEqual([
      { objectiveId: "fr.obj.a.x", result: "demonstrated", correct: 2, total: 3 },
      { objectiveId: "fr.obj.b.y", result: "needs_practice", correct: 1, total: 2 },
      { objectiveId: "fr.obj.c.z", result: "insufficient_evidence", correct: 1, total: 1 },
    ]);
  });

  test("one lucky item can never demonstrate (§64)", () => {
    const results = scoreObjectives(plan, { i6: true });
    expect(results).toEqual([
      { objectiveId: "fr.obj.c.z", result: "insufficient_evidence", correct: 1, total: 1 },
    ]);
  });

  test("skipped items are excluded from every denominator (P8 §20): device states never become learner evidence", () => {
    // A learner skipped i2/i3 (e.g. a speak step behind a blocked mic) and
    // i6 entirely: skips reach the scorer as ABSENT firstResults entries.
    const firstResults = { i1: true, i4: true, i5: false };
    const results = scoreObjectives(plan, firstResults);
    expect(results).toEqual([
      // fr.obj.a.x drained below the 2-item floor by skips → insufficient
      // evidence, never needs_practice (the skip is not a wrong answer).
      { objectiveId: "fr.obj.a.x", result: "insufficient_evidence", correct: 1, total: 1 },
      { objectiveId: "fr.obj.b.y", result: "needs_practice", correct: 1, total: 2 },
      // fr.obj.c.z fully skipped → no result minted at all: absence of
      // evidence, not evidence of absence.
    ]);
    expect(results.find((r) => r.objectiveId === "fr.obj.c.z")).toBeUndefined();

    const attempt = buildCheckpointAttempt({
      plan,
      firstResults,
      startedAt: 0,
      completedAt: 1,
    });
    // Skipped steps never appear as itemResults and never dilute or inflate
    // the overall share: 2 correct of 3 SCORED, not of 6 planned.
    expect(attempt.itemResults.map((r) => r.itemId)).toEqual(["i1", "i4", "i5"]);
    expect(attempt.overallCorrectShare).toBeCloseTo(2 / 3);
  });

  test("a skip in a scored session lands in skipped, not firstResults — the scorer never sees it", () => {
    let state = start([exerciseStep("a"), exerciseStep("b")], "none");
    state = sessionReducer(state, { type: "skip" });
    state = sessionReducer(state, { type: "answer", value: 0 });
    state = sessionReducer(state, { type: "check" });
    state = sessionReducer(state, { type: "continue" });
    expect(state.finished).toBe(true);
    expect(state.skipped).toEqual({ a: true });
    expect(state.firstResults).toEqual({ b: true });
  });

  test("buildCheckpointAttempt records first-attempt items and the overall share", () => {
    const attempt = buildCheckpointAttempt({
      plan,
      firstResults: { i1: true, i2: false, i4: true },
      startedAt: 100,
      completedAt: 200,
    });
    expect(attempt.checkpointId).toBe("fr.checkpoint.test");
    expect(attempt.itemResults).toEqual([
      { itemId: "i1", correct: true },
      { itemId: "i2", correct: false },
      { itemId: "i4", correct: true },
    ]);
    expect(attempt.overallCorrectShare).toBeCloseTo(2 / 3);
  });
});

describe("store: recordCheckpointAttempt mutates assessment state ONLY (§56-59, §147)", () => {
  test("appending an attempt changes no XP, lessons, cards, wordStats, mistakes or log", () => {
    useProgress.setState({
      activeCourseId: "fr-en",
      dailyXp: 10,
      assessment: { checkpointAttempts: [], placementFloor: 0 },
      courses: {
        "fr-en": {
          xp: 42,
          completedLessons: { "fr-en:u0-l0": true },
          mistakes: [],
          wordStats: {},
          cards: {},
          srsLegacy: {},
        },
      },
      reviewLog: [],
    } as never);
    const before = useProgress.getState();
    const beforeCourse = JSON.stringify(before.courses);
    const beforeLog = JSON.stringify(before.reviewLog);

    before.recordCheckpointAttempt({
      checkpointId: "fr.checkpoint.section-1",
      checkpointVersion: 1,
      startedAt: 1,
      completedAt: 2,
      itemResults: [{ itemId: "x", correct: true }],
      objectiveResults: [],
      overallCorrectShare: 1,
    });

    const after = useProgress.getState();
    expect(after.assessment.checkpointAttempts.length).toBe(1);
    expect(after.courses["fr-en"].xp).toBe(42);
    expect(after.dailyXp).toBe(10);
    expect(JSON.stringify(after.courses)).toBe(beforeCourse);
    expect(JSON.stringify(after.reviewLog)).toBe(beforeLog);
  });

  test("retakes append and retention caps per checkpoint without dropping the latest", () => {
    useProgress.setState({
      assessment: { checkpointAttempts: [], placementFloor: 0 },
    } as never);
    for (let i = 0; i < 8; i++) {
      useProgress.getState().recordCheckpointAttempt({
        checkpointId: "fr.checkpoint.section-1",
        checkpointVersion: 1,
        startedAt: i,
        completedAt: i + 1,
        itemResults: [],
        objectiveResults: [],
        overallCorrectShare: 0,
      });
    }
    const attempts = useProgress.getState().assessment.checkpointAttempts;
    expect(attempts.length).toBe(5);
    expect(attempts[attempts.length - 1].startedAt).toBe(7);
  });
});
