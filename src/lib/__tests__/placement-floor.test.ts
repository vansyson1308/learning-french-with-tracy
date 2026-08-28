/**
 * Placement floor integration (§81-89, §151): PATH's current-lesson pointer
 * and TODAY's frontier both start at the accepted floor; placement-cleared
 * lessons stay open but are never the frontier and are never marked
 * complete. Existing users (floor 0) see exactly the old behavior.
 */
import { describe, expect, test } from "bun:test";

import { PACKS } from "../../content/packs/index";
import { composeTodaySession, pathFrontierLesson } from "../learning/today";
import { currentLessonIndex } from "../store";
import type { TeachStep } from "../session/types";

const FR = PACKS["fr-en"];
const FR_LESSON_IDS = FR.sections.flatMap((s) =>
  s.units.flatMap((u) => u.lessons.map((l) => l.id))
);
const UA_L0_INDEX = FR_LESSON_IDS.indexOf("fr-en:ua-l0"); // Section 2 start

describe("currentLessonIndex honors the floor (§87)", () => {
  test("floor 0 (existing users, §89): plain first-incomplete behavior", () => {
    expect(currentLessonIndex({}, FR_LESSON_IDS)).toBe(0);
    expect(currentLessonIndex({ "fr-en:u0-l0": true }, FR_LESSON_IDS)).toBe(1);
  });

  test("a fresh learner placed into Section 2 starts AT the floor", () => {
    expect(currentLessonIndex({}, FR_LESSON_IDS, UA_L0_INDEX)).toBe(UA_L0_INDEX);
  });

  test("progress past the floor advances normally", () => {
    const completed = { "fr-en:ua-l0": true, "fr-en:ua-l1": true } as Record<string, true>;
    expect(currentLessonIndex(completed, FR_LESSON_IDS, UA_L0_INDEX)).toBe(UA_L0_INDEX + 2);
  });

  test("pre-floor completions never move the pointer past the floor frontier", () => {
    const completed = { "fr-en:u0-l0": true, "fr-en:u0-l1": true } as Record<string, true>;
    expect(currentLessonIndex(completed, FR_LESSON_IDS, UA_L0_INDEX)).toBe(UA_L0_INDEX);
  });

  test("a hostile floor clamps instead of exploding", () => {
    expect(currentLessonIndex({}, FR_LESSON_IDS, 9999)).toBe(FR_LESSON_IDS.length);
    expect(currentLessonIndex({}, FR_LESSON_IDS, -5)).toBe(0);
  });
});

describe("pathFrontierLesson honors the floor (§88, §151)", () => {
  test("floor 0: the first incomplete lesson, as before", () => {
    expect(pathFrontierLesson(FR, {})?.lessonId).toBe("fr-en:u0-l0");
  });

  test("CRITICAL (§151): placed into Section 2 → the frontier begins at the floor", () => {
    const frontier = pathFrontierLesson(FR, {}, UA_L0_INDEX);
    expect(frontier?.lessonId).toBe("fr-en:ua-l0");
  });

  test("pre-floor incomplete lessons are never the frontier", () => {
    // Nothing before the floor is completed — the frontier must still skip
    // every placement-cleared lesson.
    const frontier = pathFrontierLesson(FR, { "fr-en:ua-l0": true }, UA_L0_INDEX);
    expect(frontier?.lessonId).toBe("fr-en:ua-l1");
  });

  test("everything at/after the floor complete → no frontier, even with pre-floor gaps", () => {
    const completed: Record<string, true> = {};
    for (const id of FR_LESSON_IDS.slice(UA_L0_INDEX)) completed[id] = true;
    expect(pathFrontierLesson(FR, completed, UA_L0_INDEX)).toBeNull();
  });
});

describe("TODAY introduces new words from the floor frontier only (§88, §151)", () => {
  test("floored compose teaches Section-2 frontier words, not Section-1 words", () => {
    const plan = composeTodaySession({
      pack: FR,
      completedLessons: {},
      cards: {},
      preset: "regular",
      seed: 42,
      now: 1_700_000_000_000,
      placementFloor: UA_L0_INDEX,
    });
    const frontier = pathFrontierLesson(FR, {}, UA_L0_INDEX)!;
    const taught = plan.steps
      .filter((s): s is TeachStep => s.type === "teach")
      .map((s) => s.itemId);
    expect(plan.newCount).toBeGreaterThan(0);
    expect(taught.length).toBe(plan.newCount);
    for (const itemId of taught) {
      expect(frontier.gradeTargetIds).toContain(itemId);
    }
    // The un-floored plan would have taught Section-1 lesson-one words —
    // none of those may appear here.
    const unfloored = pathFrontierLesson(FR, {})!;
    for (const itemId of taught) {
      expect(unfloored.gradeTargetIds).not.toContain(itemId);
    }
  });

  test("floor 0 keeps the existing-user plan byte-identical (§89)", () => {
    const base = {
      pack: FR,
      completedLessons: {},
      cards: {},
      preset: "regular" as const,
      seed: 42,
      now: 1_700_000_000_000,
    };
    const withDefault = composeTodaySession(base);
    const withExplicitZero = composeTodaySession({ ...base, placementFloor: 0 });
    expect(JSON.stringify(withExplicitZero)).toBe(JSON.stringify(withDefault));
  });
});
