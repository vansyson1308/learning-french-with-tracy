/**
 * Placement diagnostic (§148-149): deterministic engine personas (beginner,
 * weak foundations, strong Section 1, mixed Section 2, all-strong), the
 * "I don't know" single-count rule, the item budget, the session-definition
 * shape, the skip reducer action, and the store's no-learning-memory
 * guarantee (§78).
 */
import { describe, expect, test } from "bun:test";

import { placementContent, placementEnginePlan } from "../assessment/content";
import {
  answersFromSession,
  buildPlacementResult,
  evaluateClusters,
  placementEstimates,
  recommendPlacement,
  shouldRunStage,
  type PlacementAnswers,
} from "../assessment/placement";
import { emptySessionState, sessionReducer, type SessionMachineState } from "../session/reducer";
import { buildPlacementStageSessionDefinition } from "../session/sources";
import type { ExerciseStep } from "../session/types";
import { useProgress } from "../store";

const PLAN = placementEnginePlan();
const CONTENT = placementContent();

/** All items of the given stages answered correctly. */
function allCorrect(...stageIndexes: number[]): PlacementAnswers {
  const answers: PlacementAnswers = {};
  for (const i of stageIndexes) {
    for (const cluster of PLAN.stages[i].clusters) {
      for (const id of cluster.itemIds) answers[id] = true;
    }
  }
  return answers;
}

describe("compiled placement content (§76)", () => {
  test("two stages, ten clusters, sixteen items within the authored budget", () => {
    expect(CONTENT.stages.length).toBe(2);
    const clusters = CONTENT.stages.flatMap((s) => s.clusters);
    expect(clusters.length).toBe(10);
    const items = clusters.flatMap((c) => c.items);
    expect(items.length).toBe(16);
    expect(items.length).toBeLessThanOrEqual(CONTENT.maxItems);
    expect(new Set(items.map((i) => i.id)).size).toBe(16);
    expect(CONTENT.allComfortableLessonId).toBe("fr-en:ue-l0");
  });

  test("cluster anchors walk the curriculum strictly forward (§75)", () => {
    const anchors = PLAN.stages.flatMap((s) => s.clusters.map((c) => c.anchorLessonId));
    expect(anchors).toEqual([
      "fr-en:u0-l0",
      "fr-en:u1-l0",
      "fr-en:u2-l0",
      "fr-en:u4-l0",
      "fr-en:ua-l0",
      "fr-en:ua-l1",
      "fr-en:ub-l0",
      "fr-en:ub-l1",
      "fr-en:ud-l0",
      "fr-en:ue-l0",
    ]);
  });
});

describe("engine personas (§148)", () => {
  test("beginner: an early miss recommends the very first lesson and blocks stage 2", () => {
    const answers = allCorrect(0);
    answers["fr.pli.s1.milk"] = false;
    expect(shouldRunStage(PLAN, 1, answers)).toBe(false);
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:u0-l0");
    expect(rec.allComfortable).toBe(false);
    // Only stage-1 clusters were probed — stage 2 never ran.
    expect(rec.clusterOutcomes.length).toBe(4);
  });

  test("weak reading: earliest weak cluster wins even with later gaps", () => {
    const answers = allCorrect(0);
    answers["fr.pli.s1.girl_milk"] = false; // reading gap (u2-l0)
    answers["fr.pli.s1.airport"] = false; // later places gap (u4-l0)
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:u2-l0");
  });

  test("strong Section 1, weak articles: places into Section 2's first unit", () => {
    const answers = { ...allCorrect(0, 1) };
    answers["fr.pli.s2.voyage"] = false;
    expect(shouldRunStage(PLAN, 1, answers)).toBe(true);
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:ua-l0");
    expect(rec.clusterOutcomes.length).toBe(10);
  });

  test("mixed Section 2: comfortable articles, weak être/avoir → ub-l0", () => {
    const answers = { ...allCorrect(0, 1) };
    answers["fr.pli.s2.sommes"] = false;
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:ub-l0");
  });

  test("all strong: the authored all-comfortable anchor — the course's final unit", () => {
    const rec = recommendPlacement(PLAN, allCorrect(0, 1));
    expect(rec.allComfortable).toBe(true);
    expect(rec.recommendedLessonId).toBe("fr-en:ue-l0");
  });

  test("an unanswered cluster is an unknown frontier, not skipped over", () => {
    const answers = allCorrect(0);
    delete answers["fr.pli.s1.airport"]; // places cluster entirely unanswered
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:u4-l0");
    expect(shouldRunStage(PLAN, 1, answers)).toBe(false);
  });

  test("determinism (§76): identical answers produce identical results", () => {
    const answers = allCorrect(0);
    answers["fr.pli.s1.polite"] = false;
    const a = buildPlacementResult({
      plan: PLAN,
      answers,
      recommendedFloorIndex: 4,
      completedAt: 1000,
    });
    const b = buildPlacementResult({
      plan: PLAN,
      answers,
      recommendedFloorIndex: 4,
      completedAt: 1000,
    });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.placementVersion).toBe(1);
    expect(a.recommendedLessonId).toBe("fr-en:u1-l0");
  });
});

describe('"I don\'t know" counts once (§117)', () => {
  test("an IDK makes its cluster a gap without a second penalty anywhere", () => {
    const answers = allCorrect(0);
    answers["fr.pli.s1.milk"] = null; // declared unknown; bird stays correct
    const outcomes = evaluateClusters(PLAN.stages[0], answers);
    expect(outcomes[0].outcome).toBe("gap");
    // Every other cluster is untouched by the IDK.
    expect(outcomes.slice(1).every((o) => o.outcome === "comfortable")).toBe(true);
    const rec = recommendPlacement(PLAN, answers);
    expect(rec.recommendedLessonId).toBe("fr-en:u0-l0");
    // The declared unknown is preserved as null in the stored record.
    const result = buildPlacementResult({
      plan: PLAN,
      answers,
      recommendedFloorIndex: 0,
      completedAt: 1,
    });
    expect(result.itemResults.find((r) => r.itemId === "fr.pli.s1.milk")?.correct).toBeNull();
  });

  test("estimates are only comfortable/gap/unknown — never demonstrated (§80)", () => {
    const answers = allCorrect(0);
    answers["fr.pli.s1.morning"] = null;
    delete answers["fr.pli.s1.airport"];
    const estimates = placementEstimates(evaluateClusters(PLAN.stages[0], answers));
    expect(estimates.map((e) => e.estimate)).toEqual([
      "comfortable",
      "gap",
      "comfortable",
      "unknown",
    ]);
    for (const e of estimates) {
      expect(["comfortable", "gap", "unknown"]).toContain(e.estimate);
    }
  });
});

describe("placement session definition (§104-108, §118)", () => {
  test("stage sessions are minimal-feedback scored assessments with no memory hooks", () => {
    const def = buildPlacementStageSessionDefinition(CONTENT.stages[0]);
    expect(def.kind).toBe("placement");
    expect(def.completion).toBe("placement");
    expect(def.retryPolicy).toBe("none");
    expect(def.feedbackPolicy).toBe("minimal");
    expect(def.trackMistakes).toBe(false);
    expect(def.allowUndo).toBe(false);
    expect(def.assessment).toBeUndefined();
    expect(def.steps.every((s) => s.type === "exercise")).toBe(true);
    expect(def.steps.length).toBe(7); // stage-1 items in cluster order
    expect(def.steps.map((s) => s.stepId)).toEqual(
      PLAN.stages[0].clusters.flatMap((c) => c.itemIds)
    );
  });
});

describe("skip reducer action (§117)", () => {
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

  function start(): SessionMachineState {
    return sessionReducer(emptySessionState(), {
      type: "start",
      sessionId: "t",
      steps: [exerciseStep("a"), exerciseStep("b")],
      retryPolicy: "none",
    });
  }

  test("skip records the declared unknown, advances, and never marks wrong", () => {
    let state = start();
    state = sessionReducer(state, { type: "skip" });
    expect(state.skipped).toEqual({ a: true });
    expect(state.firstResults).toEqual({});
    expect(state.wrongCounts).toEqual({});
    expect(state.completedCount).toBe(1);
    expect(state.index).toBe(1);
    // Finish the session normally.
    state = sessionReducer(state, { type: "answer", value: 0 });
    state = sessionReducer(state, { type: "check" });
    state = sessionReducer(state, { type: "continue" });
    expect(state.finished).toBe(true);
    expect(answersFromSession({ stepIds: ["a", "b"], ...state })).toEqual({
      a: null,
      b: true,
    });
  });

  test("skip is idle-only and first-encounter-only", () => {
    let state = start();
    state = sessionReducer(state, { type: "answer", value: 1 });
    state = sessionReducer(state, { type: "check" }); // status wrong
    const afterCheck = state;
    expect(sessionReducer(afterCheck, { type: "skip" })).toBe(afterCheck);
  });
});

describe("store: placement mutates assessment state ONLY (§78, §149)", () => {
  const result = {
    placementVersion: 1,
    completedAt: 123,
    recommendedLessonId: "fr-en:ua-l0",
    recommendedFloorIndex: 20,
    objectiveEstimates: [
      { objectiveId: "fr.obj.vocab.everyday_basics", estimate: "comfortable" as const },
    ],
    itemResults: [{ itemId: "fr.pli.s1.milk", correct: null }],
  };

  test("setPlacementResult touches no XP, lessons, cards, wordStats or log", () => {
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
    const beforeCourses = JSON.stringify(before.courses);
    const beforeLog = JSON.stringify(before.reviewLog);

    before.setPlacementResult(result, 20);

    const after = useProgress.getState();
    expect(after.assessment.placement?.recommendedLessonId).toBe("fr-en:ua-l0");
    expect(after.assessment.placementFloor).toBe(20);
    expect(after.courses["fr-en"].xp).toBe(42);
    expect(after.dailyXp).toBe(10);
    expect(JSON.stringify(after.courses)).toBe(beforeCourses);
    expect(JSON.stringify(after.reviewLog)).toBe(beforeLog);
    // Accepting the floor NEVER fakes lesson completion (§82).
    expect(Object.keys(after.courses["fr-en"].completedLessons)).toEqual(["fr-en:u0-l0"]);
  });

  test('"start from the beginning" stores the result with floor 0', () => {
    useProgress.setState({
      assessment: { checkpointAttempts: [], placementFloor: 0 },
    } as never);
    useProgress.getState().setPlacementResult(result, 0);
    const s = useProgress.getState().assessment;
    expect(s.placement?.recommendedFloorIndex).toBe(20);
    expect(s.placementFloor).toBe(0);
  });

  test("resetPlacement clears the floor but keeps the record (§86)", () => {
    useProgress.setState({
      assessment: { checkpointAttempts: [], placementFloor: 20, placement: result },
    } as never);
    useProgress.getState().resetPlacement();
    const s = useProgress.getState().assessment;
    expect(s.placementFloor).toBe(0);
    expect(s.placement?.completedAt).toBe(123);
  });

  test("a hostile floor value never persists (finite, non-negative, integer)", () => {
    useProgress.setState({
      assessment: { checkpointAttempts: [], placementFloor: 0 },
    } as never);
    useProgress.getState().setPlacementResult(result, Number.NaN);
    expect(useProgress.getState().assessment.placementFloor).toBe(0);
    useProgress.getState().setPlacementResult(result, -3);
    expect(useProgress.getState().assessment.placementFloor).toBe(0);
    useProgress.getState().setPlacementResult(result, 4.9);
    expect(useProgress.getState().assessment.placementFloor).toBe(4);
  });
});
