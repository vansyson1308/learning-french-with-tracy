import { describe, expect, test } from "bun:test";

import type { PackSource } from "../../content/schema";
import { lessonShapeErrors, MIN_TEACHING_EXERCISES } from "../lib/lesson-shape";
import { courseProfileFlag, loadPacks } from "../lib/pipeline";

const packs = loadPacks();
const packOf = (id: string) => packs.find((p) => p.courseId === id)!.pack;
const clone = (p: PackSource): PackSource => JSON.parse(JSON.stringify(p)) as PackSource;

describe("lesson shape (P3e)", () => {
  test("es-vi: every teaching lesson has ≥ 5 exercises, single scenarios/forms are declared, no repeated payload", () => {
    expect(MIN_TEACHING_EXERCISES).toBe(5);
    expect(lessonShapeErrors(packOf("es-vi"))).toEqual([]);
    const kinds = packOf("es-vi").sections.flatMap((s) => s.units.flatMap((u) => u.lessons.filter((l) => l.lessonKind).map((l) => l.lessonKind)));
    expect(kinds.sort()).toEqual(["form", "form", "scenario", "scenario", "scenario", "scenario", "scenario"]);
  });

  test("French is grandfathered explicitly (content byte-identical); every other course is checked", () => {
    expect(courseProfileFlag("fr-en", "legacyLessonShapes")).toBe(true);
    expect(courseProfileFlag("fr-vi", "legacyLessonShapes")).toBe(true);
    expect(courseProfileFlag("es-vi", "legacyLessonShapes")).toBeUndefined();
    expect(lessonShapeErrors(packOf("fr-en")).length).toBeGreaterThan(0);
  });

  test("a thin teaching lesson, a wrong lessonKind and a repeated payload are errors", () => {
    const p = clone(packOf("es-vi"));
    const lesson = p.sections[0].units[0].lessons[0];
    lesson.exercises = lesson.exercises.slice(0, 2);
    const scenario = p.sections[5].units[0].lessons.find((l) => l.lessonKind === "scenario")!;
    scenario.exercises.push(lesson.exercises[0]);
    const other = p.sections[1].units[0].lessons[0];
    other.exercises.push({ ...other.exercises[0], id: `${other.id}-e99` });
    const errors = lessonShapeErrors(p).join("\n");
    expect(errors).toContain("2 exercise(s) — a teaching lesson needs ≥ 5");
    expect(errors).toContain('lessonKind "scenario" is exactly one interactionScenario exercise');
    expect(errors).toContain(`${other.id}-e99 repeats the payload of`);
  });
});
