import { describe, expect, test } from "bun:test";

import frPack from "../../content/packs/fr-en.json";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import { FR_LEXEME_IDS, FR_SURFACE_FOR_ID } from "../learning/ids-fr";
import type { FsrsCardState } from "../learning/scheduler";
import {
  composeTodaySession,
  pathFrontierLesson,
  TODAY_FINALE_MAX_PAIRS,
  TODAY_PRESETS,
  type TodayPlanInput,
  type TodayPreset,
} from "../learning/today";
import type { ExerciseStep, SessionStep } from "../session/types";
import type { Pack } from "../types";

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;
const pack = frPack as unknown as Pack;

function dueCard(daysOverdue = 1): FsrsCardState {
  const due = T0 - daysOverdue * DAY;
  return {
    ...fsrsScheduler.initialCard(T0 - 30 * DAY),
    due,
    stability: 3,
    difficulty: 6,
    scheduled_days: 3,
    reps: 2,
    state: "review",
    last_review: due - 3 * DAY,
  };
}

function cardsFor(ids: string[], overdueStart = 1): Record<string, FsrsCardState> {
  return Object.fromEntries(
    ids.map((id, i) => [`${id}|recognize`, dueCard(overdueStart + i)])
  );
}

function input(overrides: Partial<TodayPlanInput> = {}): TodayPlanInput {
  return {
    pack,
    completedLessons: {},
    cards: {},
    preset: "regular",
    seed: 42,
    now: T0,
    ...overrides,
  };
}

function assessments(steps: SessionStep[]): ExerciseStep[] {
  return steps.filter(
    (s): s is ExerciseStep => s.type === "exercise" && s.evidence?.srsRole === "assessment"
  );
}

function phaseOf(steps: SessionStep[], phase: string) {
  return steps.filter((s) => s.phase === phase);
}

const FRONTIER_FIRST = pathFrontierLesson(pack, {})!;

describe("PATH frontier (§35)", () => {
  test("fresh learner: frontier is the very first lesson with its authored ids", () => {
    expect(FRONTIER_FIRST.lessonId).toBe(pack.sections[0].units[0].lessons[0].id);
    expect(FRONTIER_FIRST.gradeTargetIds.length).toBeGreaterThan(0);
    for (const id of FRONTIER_FIRST.gradeTargetIds) {
      expect(id.startsWith("fr:w:")).toBe(true);
    }
  });

  test("completing lessons advances the frontier in authored order", () => {
    const done: Record<string, true> = { [FRONTIER_FIRST.lessonId]: true };
    const next = pathFrontierLesson(pack, done)!;
    expect(next.lessonId).toBe(pack.sections[0].units[0].lessons[1].id);
  });

  test("a fully completed course has no frontier", () => {
    const all: Record<string, true> = {};
    for (const s of pack.sections)
      for (const u of s.units)
        for (const l of u.lessons) all[l.id] = true;
    expect(pathFrontierLesson(pack, all)).toBeNull();
  });

  test("Section 2 integration: with Section 1 complete, TODAY introduces Unit A words", () => {
    // Phase 5B: the frontier crosses into Section 2, whose audio-less
    // selects carry compiler-emitted gradeTargets — TODAY's new-item
    // introduction must keep working across the section boundary.
    const done: Record<string, true> = {};
    for (const u of pack.sections[0].units) for (const l of u.lessons) done[l.id] = true;
    const frontier = pathFrontierLesson(pack, done)!;
    expect(frontier.lessonId).toBe("fr-en:ua-l0");
    expect(frontier.gradeTargetIds.length).toBeGreaterThan(0);
    expect(frontier.gradeTargetIds).toContain("fr:w:maison");
    const plan = composeTodaySession(input({ completedLessons: done }));
    const teachIds = plan.steps
      .filter((s): s is Extract<SessionStep, { type: "teach" }> => s.type === "teach")
      .map((s) => s.itemId);
    expect(teachIds.length).toBeGreaterThan(0);
    for (const id of teachIds) expect(frontier.gradeTargetIds).toContain(id);
  });
});

describe("TODAY composer: warm-up and backlog (§32-33)", () => {
  const someIds = Object.values(FR_LEXEME_IDS);

  test("zero due cards → no warm-up; new material still offered", () => {
    const plan = composeTodaySession(input());
    expect(plan.reviewCount).toBe(0);
    expect(plan.backlogTotal).toBe(0);
    expect(plan.newCount).toBeGreaterThan(0);
  });

  test("one due card → exactly one warm-up assessment", () => {
    const plan = composeTodaySession(input({ cards: cardsFor(someIds.slice(0, 1)) }));
    expect(plan.reviewCount).toBe(1);
    expect(plan.backlogRemaining).toBe(0);
  });

  test.each([
    ["due < budget", 6, 6, 0],
    ["due = budget", 10, 10, 0],
    ["due > budget", 14, 10, 4],
    ["large backlog", 30, 10, 20],
  ])("%s: honest budgeting, never lies", (_name, due, expectReviews, expectRemaining) => {
    const plan = composeTodaySession(input({ cards: cardsFor(someIds.slice(0, due)) }));
    expect(plan.reviewCount).toBe(expectReviews);
    expect(plan.backlogTotal).toBe(due);
    expect(plan.backlogRemaining).toBe(expectRemaining);
  });

  test("warm-up is ordered most-at-risk first and never rewrites due dates", () => {
    const cards = cardsFor(someIds.slice(0, 5));
    const before = JSON.parse(JSON.stringify(cards));
    const plan = composeTodaySession(input({ cards }));
    expect(cards).toEqual(before); // §33: planner reads, never writes
    const warmup = phaseOf(plan.steps, "warmup") as ExerciseStep[];
    // cardsFor makes later ids more overdue → lower retrievability → earlier.
    const ids = warmup.map((s) => s.evidence!.itemId);
    expect(ids).toEqual([...someIds.slice(0, 5)].reverse());
  });
});

describe("TODAY composer: new material (§34-40)", () => {
  test("new candidates come only from the PATH frontier, in authored order", () => {
    const plan = composeTodaySession(input({ preset: "long" }));
    const teach = phaseOf(plan.steps, "new").filter((s) => s.type === "teach");
    const allowed = new Set(FRONTIER_FIRST.gradeTargetIds);
    for (const step of teach) {
      expect(allowed.has((step as { itemId: string }).itemId)).toBe(true);
    }
    expect(plan.newCount).toBeLessThanOrEqual(TODAY_PRESETS.long.newItems);
  });

  test("teach immediately precedes its own Fr→En assessment", () => {
    const plan = composeTodaySession(input());
    const steps = plan.steps;
    steps.forEach((step, i) => {
      if (step.type !== "teach") return;
      const next = steps[i + 1];
      expect(next.type).toBe("exercise");
      if (next.type === "exercise") {
        expect(next.evidence).toEqual({ itemId: step.itemId, srsRole: "assessment" });
        expect(next.exercise.type === "select" && next.exercise.mode).toBe(
          "targetToNative"
        );
      }
    });
  });

  test("items with existing cards are not 'new' (once created, never re-taught)", () => {
    const frontierIds = FRONTIER_FIRST.gradeTargetIds;
    const plan = composeTodaySession(
      input({
        // Cards exist but are NOT due (future), so they don't join warm-up.
        cards: Object.fromEntries(
          frontierIds.map((id) => [
            `${id}|recognize`,
            { ...dueCard(), due: T0 + 5 * DAY },
          ])
        ),
      })
    );
    expect(plan.newCount).toBe(0);
    expect(plan.reviewCount).toBe(0);
  });

  test("a fully completed course yields no new candidates", () => {
    const all: Record<string, true> = {};
    for (const s of pack.sections)
      for (const u of s.units) for (const l of u.lessons) all[l.id] = true;
    const plan = composeTodaySession(input({ completedLessons: all }));
    expect(plan.newCount).toBe(0);
  });

  test("missing, invalid and duplicate gradeTargets fail closed", () => {
    const crafted: Pack = JSON.parse(JSON.stringify(pack));
    const lesson = crafted.sections[0].units[0].lessons[0];
    lesson.exercises = lesson.exercises.map((e, i) => ({
      ...e,
      gradeTargets:
        i === 0
          ? ["fr:w:bogus-nonexistent"] // invalid → skipped
          : i === 1
            ? ["fr:w:homme", "fr:w:homme"] // duplicate → one candidate
            : undefined, // missing → no candidate
    })) as typeof lesson.exercises;
    const plan = composeTodaySession(input({ pack: crafted }));
    const teach = plan.steps.filter((s) => s.type === "teach");
    expect(teach).toHaveLength(1);
    expect((teach[0] as { itemId: string }).itemId).toBe("fr:w:homme");
  });

  test("an id whose word is missing from the pack is skipped (renderable rule)", () => {
    const crafted: Pack = JSON.parse(JSON.stringify(pack));
    // Remove l'homme from every unit's word list; the lesson still claims it.
    for (const s of crafted.sections)
      for (const u of s.units)
        u.words = u.words.filter((w) => w.target !== FR_SURFACE_FOR_ID["fr:w:homme"]);
    const plan = composeTodaySession(input({ pack: crafted }));
    const taught = plan.steps
      .filter((s) => s.type === "teach")
      .map((s) => (s as { itemId: string }).itemId);
    expect(taught).not.toContain("fr:w:homme");
  });
});

describe("TODAY composer: budgets and presets (§30)", () => {
  test.each(["short", "regular", "long"] as TodayPreset[])(
    "%s preset honors review/new/mixed budgets",
    (preset) => {
      const budgets = TODAY_PRESETS[preset];
      const plan = composeTodaySession(
        input({ preset, cards: cardsFor(Object.values(FR_LEXEME_IDS).slice(20, 50)) })
      );
      expect(plan.reviewCount).toBe(budgets.review);
      expect(plan.newCount).toBeLessThanOrEqual(budgets.newItems);
      expect(phaseOf(plan.steps, "mixed").length).toBeLessThanOrEqual(budgets.mixed);
      expect(plan.estimatedMinutes).toBeGreaterThan(0);
      expect(plan.estimatedMinutes).toBe(
        Math.max(1, Math.round((plan.steps.length * 20) / 60))
      );
    }
  );

  test("caught-up learner: empty plan, zero estimate", () => {
    const all: Record<string, true> = {};
    for (const s of pack.sections)
      for (const u of s.units) for (const l of u.lessons) all[l.id] = true;
    const plan = composeTodaySession(input({ completedLessons: all, cards: {} }));
    expect(plan.steps).toEqual([]);
    expect(plan.estimatedMinutes).toBe(0);
  });
});

describe("TODAY composer: evidence safety (§43)", () => {
  test("assessment targets are unique — one designated probe per card", () => {
    const plan = composeTodaySession(
      input({ cards: cardsFor(Object.values(FR_LEXEME_IDS).slice(10, 22)) })
    );
    const ids = assessments(plan.steps).map((s) => s.evidence!.itemId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("mixed steps are practice-only; finale carries no evidence plan", () => {
    const plan = composeTodaySession(input());
    for (const step of phaseOf(plan.steps, "mixed")) {
      expect(step.type === "exercise" && step.evidence?.srsRole).toBe("practice");
    }
    for (const step of phaseOf(plan.steps, "finale")) {
      expect(step.type === "exercise" && step.evidence).toBeUndefined();
      expect(step.type === "exercise" && step.exercise.type).toBe("match");
    }
  });

  test("mixed avoids sitting right after the same item's assessment", () => {
    const plan = composeTodaySession(input({ preset: "regular" }));
    const steps = plan.steps;
    const firstMixedIdx = steps.findIndex((s) => s.phase === "mixed");
    if (firstMixedIdx <= 0) return; // no mixed phase composed
    const prev = steps[firstMixedIdx - 1];
    const mixed = steps[firstMixedIdx];
    const mixedItems = phaseOf(steps, "mixed");
    if (
      mixedItems.length > 1 &&
      prev.type === "exercise" &&
      mixed.type === "exercise" &&
      prev.evidence &&
      mixed.evidence
    ) {
      const distinctMixedTargets = new Set(
        mixedItems.map((s) => s.type === "exercise" && s.evidence?.itemId)
      );
      if (distinctMixedTargets.size > 1) {
        expect(mixed.evidence.itemId).not.toBe(prev.evidence.itemId);
      }
    }
  });
});

describe("TODAY composer: finale (§44)", () => {
  test("finale has 2-4 unique pairs when material exists", () => {
    const plan = composeTodaySession(input());
    const finale = phaseOf(plan.steps, "finale");
    expect(finale).toHaveLength(1);
    const ex = (finale[0] as ExerciseStep).exercise;
    if (ex.type === "match") {
      expect(ex.pairs.length).toBeGreaterThanOrEqual(2);
      expect(ex.pairs.length).toBeLessThanOrEqual(TODAY_FINALE_MAX_PAIRS);
      const natives = ex.pairs.map((p) => p.native);
      expect(new Set(natives).size).toBe(natives.length);
    }
  });

  test("finale is skipped with fewer than 2 unique session items", () => {
    // One due card, course fully completed → exactly one session item.
    const all: Record<string, true> = {};
    for (const s of pack.sections)
      for (const u of s.units) for (const l of u.lessons) all[l.id] = true;
    const plan = composeTodaySession(
      input({
        completedLessons: all,
        cards: cardsFor(Object.values(FR_LEXEME_IDS).slice(0, 1)),
      })
    );
    expect(phaseOf(plan.steps, "finale")).toHaveLength(0);
    expect(plan.steps.length).toBeGreaterThan(0); // warm-up + mixed still run
  });
});

describe("TODAY composer: determinism (§46)", () => {
  const richInput = () =>
    input({ cards: cardsFor(Object.values(FR_LEXEME_IDS).slice(30, 42)) });

  test("same state + preset + seed → identical plan", () => {
    expect(composeTodaySession(richInput())).toEqual(composeTodaySession(richInput()));
  });

  test("a different seed may reorder but keeps the same session contents", () => {
    const a = composeTodaySession(richInput());
    const b = composeTodaySession({ ...richInput(), seed: 4242 });
    expect(a).not.toEqual(b); // ordering/options differ...
    const idsOf = (p: typeof a) =>
      assessments(p.steps)
        .map((s) => s.evidence!.itemId)
        .sort();
    expect(idsOf(a)).toEqual(idsOf(b)); // ...but the material is the same
  });

  test("plan never mutates its inputs", () => {
    const cards = cardsFor(Object.values(FR_LEXEME_IDS).slice(0, 3));
    const completed = { [FRONTIER_FIRST.lessonId]: true } as Record<string, true>;
    const snapshotCards = JSON.parse(JSON.stringify(cards));
    const snapshotDone = { ...completed };
    composeTodaySession(input({ cards, completedLessons: completed }));
    expect(cards).toEqual(snapshotCards);
    expect(completed).toEqual(snapshotDone);
  });
});
