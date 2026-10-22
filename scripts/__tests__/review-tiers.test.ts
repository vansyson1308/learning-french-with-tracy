/**
 * P3e §8: the tiered review files stay within budget, cover the
 * high-impact text, and the beta label follows the review state.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { lineCount, renderTier1Native, renderTier1Target, TIER1_NATIVE_MAX_LINES, TIER1_TARGET_MAX_LINES } from "../lib/authoring/review-tiers";
import { courseIsBeta, readJson } from "../lib/pipeline";

describe("Tier-1 review files (es-vi)", () => {
  const vi = renderTier1Native("es-vi");
  const es = renderTier1Target("es-vi");

  test("fit their line budgets", () => {
    expect(lineCount(vi)).toBeLessThanOrEqual(TIER1_NATIVE_MAX_LINES);
    expect(lineCount(es)).toBeLessThanOrEqual(TIER1_TARGET_MAX_LINES);
  });

  test("the Vietnamese tier covers every unit, concept, scenario goal and exam instruction", () => {
    const pack = readJson("content/courses/es-vi.json") as { sections: { units: { id: string }[] }[] };
    for (const u of pack.sections.flatMap((s) => s.units)) expect(vi).toContain(`## ${u.id} — `);
    const concepts = (readJson("content/es/pedagogy/concepts.json") as { concepts: { id: string }[] }).concepts;
    for (const c of concepts) expect(vi).toContain(`\`${c.id}\``);
    const scenarios = (readJson("content/es/interaction/scenarios.json") as { scenarios: { id: string; goal: { vi: string } }[] }).scenarios;
    for (const s of scenarios) expect(vi).toContain(s.goal.vi);
    const exam = readJson("content/es/exam/dele-a1.json") as { sections: { tasks: { instruction: { vi: string } }[] }[] };
    for (const t of exam.sections.flatMap((s) => s.tasks)) expect(vi).toContain(t.instruction.vi);
  });

  test("the Spanish tier briefs the teacher in Vietnamese and English and lists exam texts", () => {
    expect(es).toContain("**Tiếng Việt.**");
    expect(es).toContain("**English.**");
    expect(es).toContain("Peninsular Spanish");
    const exam = (readJson("content/es/reception/reading.json") as { readings: { id: string; use?: string }[] }).readings.filter((r) => r.use === "exam");
    for (const r of exam) expect(es).toContain(`\`${r.id}\``);
  });

  test("the committed files are the generated ones (until the reviewer starts ticking)", () => {
    expect(readFileSync("content/es/REVIEW-TIER1-vi.md", "utf8").split("\n").length).toBeLessThanOrEqual(TIER1_NATIVE_MAX_LINES + 1);
    expect(readFileSync("content/es/REVIEW-TIER1-es.md", "utf8").split("\n").length).toBeLessThanOrEqual(TIER1_TARGET_MAX_LINES + 1);
  });
});

describe("beta label (P3e §8)", () => {
  test("es-vi is beta until its review is recorded; French courses are not labelled", () => {
    expect(courseIsBeta("es-vi")).toBe(true);
    expect(courseIsBeta("fr-vi")).toBe(false);
    expect(courseIsBeta("fr-en")).toBe(false);
    const profiles = (readJson("src/content/course-profiles.json") as { profiles: Record<string, { beta?: true }> }).profiles;
    expect(profiles["es-vi"].beta).toBe(true);
    expect(profiles["fr-vi"].beta).toBeUndefined();
    expect(profiles["es-en"].beta).toBeUndefined();
  });
});
