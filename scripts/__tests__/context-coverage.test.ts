/**
 * Context coverage (QC 2026-10-28 §4): a syllabus lexeme has context when
 * a lesson grades it, a reading or clip references it, or a story uses it;
 * the report lists the rest unit by unit.
 */
import { describe, expect, test } from "bun:test";

import type { PackSource } from "../../content/schema";
import { computeContextCoverage } from "../lib/context-coverage";

const pack = {
  sections: [{ units: [{ lessons: [{ exercises: [{ type: "select", id: "a" }, { type: "select", id: "b" }] }] }] }],
} as unknown as PackSource;

describe("context coverage", () => {
  test("each source counts; the missing lexemes are listed per unit in syllabus order", () => {
    const report = computeContextCoverage({
      syllabus: {
        level: "A1",
        entries: [
          { lexemeId: "x:w:1", unitId: "u1" },
          { lexemeId: "x:w:2", unitId: "u1" },
          { lexemeId: "x:w:3", unitId: "u2" },
          { lexemeId: "x:w:4", unitId: "u2" },
          { lexemeId: "x:w:5", unitId: "u2" },
        ],
      },
      packs: [pack],
      gradeTargets: (e) => ((e as { id: string }).id === "a" ? ["x:w:1"] : undefined),
      readings: { readings: [{ lexemeRefs: ["x:w:3"] }] },
      listening: { clips: [{ lexemeRefs: [] }] },
      stories: [["x:w:4", "x:w:99"]],
    });
    expect(report.syllabus).toBe(5);
    expect(report.withContext).toBe(3);
    expect(report.share).toBe(0.6);
    expect(report.bySource).toEqual({ lessons: 1, readings: 1, listening: 0, stories: 1 });
    expect(report.units).toEqual([
      { unitId: "u1", total: 2, withContext: 1, missing: ["x:w:2"] },
      { unitId: "u2", total: 3, withContext: 2, missing: ["x:w:5"] },
    ]);
  });
});
