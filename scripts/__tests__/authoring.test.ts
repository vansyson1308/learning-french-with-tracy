/**
 * Authoring toolkit tests (P3c): the prompt bundle carries everything a
 * Claude session needs (task, schema, allowed ids, exemplars with
 * Vietnamese text, brief, style); every committed record of the synthetic
 * `xx` language round-trips through its step schema (dry-run ingest);
 * the linters see French's known issues from the audit (answer-position
 * bias, five duplicate payloads, thin Section 3–6 guidebooks) and the
 * CEFR-descriptor leak check fires on descriptor wording; the review gate
 * schema accepts a sign-off and rejects a malformed one.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "fs";

import { CourseProfileOverrideSchema, type PackSource } from "../../content/schema";
import { allowedIds, buildBundle } from "../lib/authoring/bundle";
import { ingestStep } from "../lib/authoring/ingest";
import { CEFR_DESCRIPTOR_PHRASES, lintCourse, lintPack } from "../lib/authoring/lint";
import { STEP_IDS, stepDef } from "../lib/authoring/steps";
import { readJson, safeResolve } from "../lib/pipeline";

describe("prompt bundles", () => {
  test("the Spanish objectives bundle embeds task, JSON schema, allowed ids, French exemplars with Vietnamese text, brief and style", () => {
    const b = buildBundle("objectives", "es", "vi", "es-vi");
    expect(b.promptPath).toBe("content/es/_drafts/objectives/PROMPT.md");
    expect(b.promptMd).toContain("## Nhiệm vụ");
    expect(b.promptMd).toContain('"$schema"');
    expect(b.promptMd).toContain("Brief sư phạm: người Việt học tiếng Tây Ban Nha");
    expect(b.promptMd).toContain("Văn phong tiếng Việt");
    const input = b.input as { allowedIds: { lexemes: unknown[] }; exemplars: { canDo: Record<string, string> }[]; recordSchema: { type: string } };
    expect(input.allowedIds.lexemes.length).toBeGreaterThanOrEqual(700);
    expect(input.exemplars.length).toBe(3);
    expect(input.exemplars[0].canDo.vi).toMatch(/^Tôi có thể/);
    expect(input.recordSchema.type).toBe("object");
  });

  test("every step has a schema, a target and a blueprint slice; the units step offers lessons from the draft pack", () => {
    for (const id of STEP_IDS) {
      const def = stepDef(id);
      expect(def.recordSchema("es", "vi")).toBeDefined();
      expect(def.target("es", "es-vi")).toContain("content/");
      expect(def.sessions.length).toBeGreaterThan(0);
    }
    const ids = allowedIds("fr", "vi", "fr-vi");
    expect(ids.objectives.length).toBe(34);
    expect(ids.clips.length).toBe(177);
    expect(ids.lessons.length).toBe(108);
  });
});

describe("ingest round trip on the synthetic language", () => {
  test("committed xx objectives pass their step schema in a dry run; a draft marker and a bad id fail with reasons", () => {
    const dir = "content/xx/_drafts/_test-objectives"; // gitignored self-test area (paths must stay inside the repo)
    mkdirSync(safeResolve(dir), { recursive: true });
    const objectives = (readJson("content/xx/assessment/objectives.json") as { objectives: Record<string, unknown>[] }).objectives;
    const bad = { ...objectives[0], id: "yy.obj.bad", title: { en: "TODO: fill" } };
    const out = `${dir}/OUTPUT.jsonl`;
    writeFileSync(safeResolve(out), `${objectives.map((o) => JSON.stringify(o)).join("\n")}\n${JSON.stringify(bad)}\nnot json\n`);
    const result = ingestStep("objectives", "xx", "en", "xx-en", { dryRun: true, outputPath: out, reportDir: dir });
    expect(result.rows.filter((r) => r.ok).length).toBe(objectives.length);
    const failed = result.rows.filter((r) => !r.ok);
    expect(failed.length).toBe(2);
    expect(failed[0].reasons.join(" ")).toMatch(/id|draft marker/);
    expect(failed[1].id).toBe("(unparsable)");
    expect(result.written).toEqual([]);
  });
});

describe("linters see the audit's known French issues", () => {
  const report = lintCourse("fr-en");
  const by = (rule: string) => report.findings.filter((f) => f.rule === rule);
  test("answer-position bias: select 176/271 at index 0, listening 35/35, reading 24/24", () => {
    const msgs = by("answer-position-bias").map((f) => `${f.where}: ${f.message}`);
    expect(msgs.some((m) => m.startsWith("select: 176/271"))).toBe(true);
    expect(msgs.some((m) => m.startsWith("listeningComprehension: 35/35"))).toBe(true);
    expect(msgs.some((m) => m.startsWith("readingComprehension: 24/24"))).toBe(true);
  });
  test("exactly the five duplicate payloads", () => {
    const dup = by("duplicate-payload").map((f) => f.where).sort();
    expect(dup).toEqual(["fr-en:u0-l2-e10 = fr-en:u2-l0-e10", "fr-en:ub-l0-e5 = fr-en:ue-l3-e5", "s3-e17 = s3-e63", "s3-e5 = s3-e24", "s4-e27 = s4-e33"]);
  });
  test("thin Section 5 guidebooks (136–271 chars) are flagged; Sections 1–2 are not", () => {
    const where = by("guidebook-length").map((f) => f.where);
    for (const u of ["fr-en:unit-o", "fr-en:unit-p", "fr-en:unit-q", "fr-en:unit-r"]) expect(where).toContain(u);
    for (const u of ["fr-en:unit-1", "fr-en:unit-a", "fr-en:unit-b"]) expect(where).not.toContain(u);
  });
  test("no CEFR descriptor phrase leaks into French", () => {
    expect(by("cefr-descriptor-leak")).toEqual([]);
  });
  test("the descriptor leak check fires on descriptor wording", () => {
    const pack = readJson("content/courses/xx-en.json") as PackSource;
    const leaky: PackSource = { ...pack, sections: [{ ...pack.sections[0], units: [{ ...pack.sections[0].units[0], description: CEFR_DESCRIPTOR_PHRASES[0] }] }] };
    const r = lintPack(leaky, null, "en");
    expect(r.findings.some((f) => f.rule === "cefr-descriptor-leak")).toBe(true);
  });
});

describe("review gate", () => {
  test("profile overrides accept a sign-off or allowUnreviewed, reject a malformed date", () => {
    expect(CourseProfileOverrideSchema.safeParse({ review: { native: "Nguyễn Văn A", date: "2026-10-20" } }).success).toBe(true);
    expect(CourseProfileOverrideSchema.safeParse({ allowUnreviewed: true }).success).toBe(true);
    expect(CourseProfileOverrideSchema.safeParse({ review: { native: "A", date: "20-10-2026" } }).success).toBe(false);
  });
});
