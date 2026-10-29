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

describe("Tier-1 review files name the course's own language and variety (D-10 review)", () => {
  test("de-vi: German, Bundesdeutsch, Austrian and Swiss forms — never Spanish", () => {
    const de = renderTier1Target("de-vi");
    const vi = renderTier1Native("de-vi");
    expect(de.split("\n")[0]).toBe("# Review Tier 1 — Deutsch (de-vi)");
    expect(de).toContain("các văn bản tiếng Đức dài nhất");
    expect(de).toContain("**tiếng Đức chuẩn dùng ở Đức (Bundesdeutsch)**");
    expect(de).toContain("Dạng từ của Áo và Thụy Sĩ chỉ nằm trong danh sách đáp án chấp nhận");
    expect(de).toContain("the longest German texts");
    expect(de).toContain("**German as used in Germany (Bundesdeutsch)**");
    expect(de).toContain("Austrian and Swiss forms appear only in accepted-answer lists");
    expect(vi).toContain("Tiếng Đức in nghiêng chỉ để đối chiếu.");
    for (const text of [de, vi]) {
      expect(text).not.toMatch(/Tây Ban Nha|Spanish|español|Latin-American|Mỹ Latinh/);
    }
  });

  test("es-vi keeps its Peninsular brief", () => {
    const es = renderTier1Target("es-vi");
    expect(es.split("\n")[0]).toBe("# Review Tier 1 — español (es-vi)");
    expect(es).toContain("**tiếng Tây Ban Nha bán đảo (Tây Ban Nha)**");
    expect(es).toContain("Latin-American forms appear only in accepted-answer lists, never here.");
    expect(renderTier1Native("es-vi")).toContain("Tiếng Tây Ban Nha in nghiêng chỉ để đối chiếu.");
  });

  test("a language without a variety note gets a neutral brief (fr-vi)", () => {
    const fr = renderTier1Target("fr-vi");
    expect(fr.split("\n")[0]).toBe("# Review Tier 1 — français (fr-vi)");
    expect(fr).toContain("các văn bản tiếng Pháp dài nhất");
    expect(fr).toContain("The standard is **French** at **CEFR A1**");
    expect(fr).not.toMatch(/Tây Ban Nha|Spanish|Latin-American/);
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
