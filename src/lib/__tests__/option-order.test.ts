/**
 * Scored MCQ option-order randomization (Phase 10 Gate 3, §17-§19): the
 * rendered correct position must not be exploitable, the order must be
 * stable within one administration and vary across administrations, and
 * nothing about the item's meaning may change.
 */
import { describe, expect, test } from "bun:test";

import {
  CHECKPOINT_ORDER,
  checkpointFor,
  placementContent,
} from "../assessment/content";
import {
  OPTION_ORDER_SCORED_TYPES,
  administrationSeed,
  seededPermutation,
  shuffleScoredOptions,
} from "../assessment/option-order";
import {
  buildCheckpointSessionDefinition,
  buildPlacementStageSessionDefinition,
} from "../session/sources";
import type { Exercise } from "../types";

type Mcq = Extract<
  Exercise,
  { type: "select" | "fillBlank" | "listeningComprehension" | "readingComprehension" }
>;

const isMcq = (e: Exercise): e is Mcq => OPTION_ORDER_SCORED_TYPES.has(e.type);
const optionText = (o: Mcq["options"][number]) => (typeof o === "string" ? o : o.text);

function correctPositions(
  build: (attempt: number) => { steps: { type: string; exercise?: Exercise }[] },
  attempts: number
): { byPosition: Map<number, number>; byItem: Map<string, Set<number>>; total: number } {
  const byPosition = new Map<number, number>();
  const byItem = new Map<string, Set<number>>();
  let total = 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    for (const step of build(attempt).steps) {
      if (step.type !== "exercise" || !step.exercise || !isMcq(step.exercise)) continue;
      total += 1;
      byPosition.set(step.exercise.correct, (byPosition.get(step.exercise.correct) ?? 0) + 1);
      const set = byItem.get(step.exercise.id) ?? new Set<number>();
      set.add(step.exercise.correct);
      byItem.set(step.exercise.id, set);
    }
  }
  return { byPosition, byItem, total };
}

describe("seededPermutation", () => {
  test("is a permutation, deterministic under a seed, and varies across seeds", () => {
    const a = seededPermutation(4, "s1");
    expect([...a].sort()).toEqual([0, 1, 2, 3]);
    expect(seededPermutation(4, "s1")).toEqual(a);
    const distinct = new Set(
      Array.from({ length: 40 }, (_, i) => seededPermutation(4, `seed${i}`).join())
    );
    expect(distinct.size).toBeGreaterThan(10);
  });
});

describe("shuffleScoredOptions", () => {
  const select: Exercise = {
    type: "select",
    id: "x",
    mode: "nativeToTarget",
    prompt: "p",
    options: [{ text: "A" }, { text: "B" }, { text: "C" }, { text: "D" }],
    correct: 0,
  };

  test("keeps the same answer, the same option multiset, and one correct index", () => {
    for (let i = 0; i < 50; i += 1) {
      const out = shuffleScoredOptions(select, `seed${i}`);
      if (out.type !== "select") throw new Error("type changed");
      expect(out.options.map((o) => o.text).sort()).toEqual(["A", "B", "C", "D"]);
      expect(out.options[out.correct].text).toBe("A");
      expect(out.options.filter((o) => o.text === "A").length).toBe(1);
    }
  });

  test("is stable for one seed and moves the answer off index 0 for most seeds", () => {
    expect(shuffleScoredOptions(select, "same")).toEqual(shuffleScoredOptions(select, "same"));
    const atZero = Array.from({ length: 200 }, (_, i) =>
      shuffleScoredOptions(select, `seed${i}`)
    ).filter((e) => e.correct === 0).length;
    expect(atZero).toBeLessThan(80); // ~25% expected; a pattern at 0 is gone
    expect(atZero).toBeGreaterThan(10);
  });

  test("leaves articleSelect and every non-MCQ type untouched (order carries meaning)", () => {
    const article: Exercise = {
      type: "articleSelect",
      id: "a",
      articles: ["le", "la", "l'", "les"],
      noun: "eau",
      gloss: "water",
      correct: 2,
    };
    expect(shuffleScoredOptions(article, "seed")).toBe(article);
    const typed: Exercise = {
      type: "typeAnswer",
      id: "t",
      mode: "translate",
      prompt: "p",
      answer: "a",
      alternatives: [],
    };
    expect(shuffleScoredOptions(typed, "seed")).toBe(typed);
  });

  test("handles string options (fillBlank) identically", () => {
    const fill: Exercise = {
      type: "fillBlank",
      id: "f",
      sentence: "Je ___ Marie.",
      translation: "I am Marie.",
      options: ["suis", "es", "est", "sommes"],
      correct: 0,
    };
    const out = shuffleScoredOptions(fill, "seed7");
    if (out.type !== "fillBlank") throw new Error("type changed");
    expect(out.options[out.correct]).toBe("suis");
    expect([...out.options].sort()).toEqual(["es", "est", "sommes", "suis"]);
  });
});

describe("checkpoint administrations are not exploitable by position (§19)", () => {
  const ATTEMPTS = 12;

  for (const id of CHECKPOINT_ORDER) {
    const checkpoint = checkpointFor(id)!;
    const mcqCount = checkpoint.items.filter((i) => isMcq(i.exercise)).length;
    if (mcqCount < 4) continue;

    test(`${id}: no rendered position dominates across ${ATTEMPTS} administrations`, () => {
      const { byPosition, byItem, total } = correctPositions(
        (attempt) => buildCheckpointSessionDefinition(checkpoint, attempt),
        ATTEMPTS
      );
      expect(total).toBeGreaterThanOrEqual(mcqCount * (checkpoint.forms ? ATTEMPTS / 2 : ATTEMPTS));
      for (const [position, count] of byPosition) {
        expect({ position, share: count / total }).toEqual({
          position,
          share: expect.any(Number),
        });
        expect(count / total).toBeLessThan(0.5);
      }
      // Every position is used somewhere, and every item's answer moves.
      expect(byPosition.size).toBe(4);
      for (const [item, positions] of byItem) {
        expect({ item, distinctPositions: positions.size }).toEqual({
          item,
          distinctPositions: expect.any(Number),
        });
        expect(positions.size).toBeGreaterThanOrEqual(2);
      }
    });
  }

  test("the authored index-0 pattern is gone from Section 1 on the very first attempt", () => {
    const first = buildCheckpointSessionDefinition(checkpointFor("fr.checkpoint.section-1")!, 0);
    const positions = first.steps
      .map((s) => (s.type === "exercise" && isMcq(s.exercise) ? s.exercise.correct : null))
      .filter((p): p is number => p !== null);
    expect(positions.length).toBe(12);
    expect(new Set(positions).size).toBeGreaterThanOrEqual(3);
  });

  test("one administration is stable: the same attempt count renders the same order", () => {
    const cp = checkpointFor("fr.checkpoint.section-3")!;
    expect(buildCheckpointSessionDefinition(cp, 2)).toEqual(buildCheckpointSessionDefinition(cp, 2));
    expect(buildCheckpointSessionDefinition(cp, 2)).not.toEqual(buildCheckpointSessionDefinition(cp, 3));
  });

  test("shuffling never changes what the item asks or which answer is right", () => {
    for (const id of CHECKPOINT_ORDER) {
      const cp = checkpointFor(id)!;
      const rendered = buildCheckpointSessionDefinition(cp, 5);
      for (const step of rendered.steps) {
        if (step.type !== "exercise") continue;
        const source = cp.items.find((i) => i.id === step.stepId)!.exercise;
        if (!isMcq(source) || !isMcq(step.exercise)) {
          expect(step.exercise).toEqual(source);
          continue;
        }
        expect(optionText(step.exercise.options[step.exercise.correct])).toBe(
          optionText(source.options[source.correct])
        );
        expect(step.exercise.options.map(optionText).sort()).toEqual(
          source.options.map(optionText).sort()
        );
        const { options: _o, correct: _c, ...restRendered } = step.exercise;
        const { options: _so, correct: _sc, ...restSource } = source;
        expect(restRendered).toEqual(restSource);
      }
    }
  });
});

describe("placement administrations (§17)", () => {
  test("each run seed fixes the order; runs differ; no position dominates", () => {
    const stages = placementContent().stages.filter(
      (s) => s.clusters.flatMap((c) => c.items).filter((i) => isMcq(i.exercise)).length >= 4
    );
    expect(stages.length).toBeGreaterThanOrEqual(2);
    for (const stage of stages) {
      expect(buildPlacementStageSessionDefinition(stage, "runA")).toEqual(
        buildPlacementStageSessionDefinition(stage, "runA")
      );
      const { byPosition, total } = correctPositions(
        (n) => buildPlacementStageSessionDefinition(stage, `run${n}`),
        12
      );
      for (const count of byPosition.values()) expect(count / total).toBeLessThan(0.5);
      expect(byPosition.size).toBe(4);
    }
  });

  test("the builder stays pure: an empty seed is deterministic too", () => {
    const stage = placementContent().stages[0];
    expect(buildPlacementStageSessionDefinition(stage)).toEqual(
      buildPlacementStageSessionDefinition(stage)
    );
  });

  test("administrationSeed is a plain, inspectable join", () => {
    expect(administrationSeed(["a", 1, "b"])).toBe("a:1:b");
  });
});
