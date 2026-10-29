/** QC 2026-10-30 §2.1: the picture-cue linter, and every authored course passing it. */
import { describe, expect, test } from "bun:test";

import { loadPacks, pictureCueProblems, validateExercise } from "../lib/pipeline";

describe("picture-cue linter", () => {
  test("two options sharing a picture fail; distinct pictures and text-only pass", () => {
    expect(pictureCueProblems("x:e1", [{ text: "hello", emoji: "👋" }, { text: "bye", emoji: "👋" }, { text: "thanks", emoji: "🙏" }])).toEqual([
      'x:e1: options "hello" and "bye" share the picture 👋 — make them distinct or remove the pictures',
    ]);
    expect(pictureCueProblems("x:e2", [{ text: "apple", emoji: "🍎" }, { text: "bread", emoji: "🍞" }])).toEqual([]);
    expect(pictureCueProblems("x:e3", [{ text: "apple" }, { text: "bread" }])).toEqual([]);
  });

  test("pictures on some options only fail (they would telegraph those)", () => {
    expect(pictureCueProblems("x:e4", [{ text: "apple", emoji: "🍎" }, { text: "bread" }])).toEqual(["x:e4: 1 of 2 options have a picture — all or none"]);
  });

  test("no authored choice question of any course shares a picture", () => {
    const problems: string[] = [];
    for (const { courseId, pack } of loadPacks()) {
      for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) for (const e of l.exercises) {
        validateExercise(courseId, e, (m) => {
          if (m.includes("picture")) problems.push(m);
        });
      }
    }
    expect(problems).toEqual([]);
  });
});
