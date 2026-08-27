/**
 * articleSelect content-validation rules (§54–57): index range, unique
 * articles, the elision/h-aspiré safety rule, and the French-only guard —
 * each proven to fire.
 */
import { describe, expect, test } from "bun:test";

import { validateExercise } from "../lib/pipeline";

type Drill = {
  type: "articleSelect";
  id: string;
  articles: string[];
  noun: string;
  gloss: string;
  correct: number;
};

const drill = (over: Partial<Drill> = {}): Drill => ({
  type: "articleSelect",
  id: "gx1",
  articles: ["le", "la"],
  noun: "pomme",
  gloss: "the apple",
  correct: 1,
  ...over,
});

function errorsFor(courseId: string, exercise: Drill): string[] {
  const errors: string[] = [];
  validateExercise(courseId, exercise as never, (m) => errors.push(m));
  return errors;
}

describe("articleSelect validation rules", () => {
  test("a consonant-initial le/la drill passes", () => {
    expect(errorsFor("fr-en", drill())).toEqual([]);
  });

  test("correct index out of range fails", () => {
    expect(errorsFor("fr-en", drill({ correct: 2 })).join("\n")).toContain("out of range");
  });

  test("duplicate articles fail", () => {
    expect(errorsFor("fr-en", drill({ articles: ["le", "le"], correct: 0 })).join("\n")).toContain(
      "duplicate articles"
    );
  });

  test("§57 elision safety: le/la on vowel- or h-initial nouns fails", () => {
    expect(errorsFor("fr-en", drill({ noun: "eau" })).join("\n")).toContain("elide to l'");
    expect(errorsFor("fr-en", drill({ noun: "homme", correct: 0 })).join("\n")).toContain("elide to l'");
    expect(errorsFor("fr-en", drill({ noun: "étoile" })).join("\n")).toContain("elide to l'");
  });

  test("un/une drills are exempt from the elision rule (no elision with un/une)", () => {
    expect(errorsFor("fr-en", drill({ articles: ["un", "une"], noun: "eau", correct: 1 }))).toEqual([]);
  });

  test("articleSelect outside the French course fails", () => {
    expect(errorsFor("es-en", drill()).join("\n")).toContain("French pedagogy");
  });
});
