/**
 * Context coverage (coordinator QC 2026-10-28 §4; the P3f context rule):
 * every syllabus lexeme should meet the learner in at least one context —
 * a lesson exercise that grades it, a reading or listening clip that
 * references it, or a graded story that uses it. The report lists, unit by
 * unit, the syllabus lexemes with NO context, so stories can be written to
 * close the gap. Report only (content/reports/<lang>/context-coverage.json);
 * it is not a gate yet.
 */
import type { PackSource } from "../../content/schema";

type AnyExercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];

export type ContextCoverageInput = {
  syllabus: { level: string; entries: { lexemeId: string; unitId: string }[] };
  /** Compiled packs' exercises carry gradeTargets; source packs are graded through `gradeTargets`. */
  packs: PackSource[];
  gradeTargets: (e: AnyExercise) => string[] | undefined;
  readings: { readings: { lexemeRefs?: string[] }[] } | null;
  listening: { clips: { lexemeRefs?: string[] }[] } | null;
  /** Distinct lexemes per analysed story. */
  stories: string[][];
};

export type ContextCoverage = {
  generator: string;
  rule: string;
  level: string;
  syllabus: number;
  withContext: number;
  share: number;
  bySource: { lessons: number; readings: number; listening: number; stories: number };
  units: { unitId: string; total: number; withContext: number; missing: string[] }[];
};

export function computeContextCoverage(input: ContextCoverageInput): ContextCoverage {
  const lessons = new Set<string>();
  for (const pack of input.packs)
    for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) for (const e of l.exercises) for (const id of input.gradeTargets(e as AnyExercise) ?? []) lessons.add(id);
  const readings = new Set((input.readings?.readings ?? []).flatMap((r) => r.lexemeRefs ?? []));
  const listening = new Set((input.listening?.clips ?? []).flatMap((c) => c.lexemeRefs ?? []));
  const stories = new Set(input.stories.flat());
  const has = (id: string) => lessons.has(id) || readings.has(id) || listening.has(id) || stories.has(id);

  const ids = input.syllabus.entries.map((e) => e.lexemeId);
  const count = (set: Set<string>) => ids.filter((id) => set.has(id)).length;
  const units: ContextCoverage["units"] = [];
  for (const e of input.syllabus.entries) {
    let row = units.find((u) => u.unitId === e.unitId);
    if (!row) units.push((row = { unitId: e.unitId, total: 0, withContext: 0, missing: [] }));
    row.total += 1;
    if (has(e.lexemeId)) row.withContext += 1;
    else row.missing.push(e.lexemeId);
  }
  const withContext = ids.filter(has).length;
  return {
    generator: "scripts/lib/context-coverage.ts",
    rule: "a syllabus lexeme has context when a lesson exercise grades it, a reading or listening clip references it, or a graded story uses it",
    level: input.syllabus.level,
    syllabus: ids.length,
    withContext,
    share: ids.length === 0 ? 1 : Math.round((withContext / ids.length) * 10_000) / 10_000,
    bySource: { lessons: count(lessons), readings: count(readings), listening: count(listening), stories: count(stories) },
    units,
  };
}

export function compileContextCoverageReport(input: ContextCoverageInput): string {
  return `${JSON.stringify(computeContextCoverage(input), null, 2)}\n`;
}
