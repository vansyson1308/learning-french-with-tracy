/**
 * Context coverage (QC 2026-10-28 §4): a syllabus lexeme has context when
 * a lesson grades it, a reading or clip references it, or a story uses it;
 * the report lists the rest unit by unit. QC 2026-10-29 evening §2: only
 * sources at or below the lexeme's level count.
 */
import { describe, expect, test } from "bun:test";

import type { PackSource, StoryBand } from "../../content/schema";
import {
  cefrLevel,
  computeContextCoverage,
  contextGateErrors,
  contextGatePath,
  levelCorrect,
  unitBands,
  type ContextCoverageInput,
  type ContextGate,
} from "../lib/context-coverage";
import { loadRichLexicon } from "../lib/lexicon";
import { gradeTargetsFor, loadIdMaps, loadLegacyMaps, loadPacks, packsForTarget, readJson } from "../lib/pipeline";
import { loadListening, loadReadings } from "../lib/reception";
import { loadStories, validateStories } from "../lib/stories";
import { loadSyllabus } from "../lib/syllabus";

const pack = {
  sections: [{ units: [{ id: "u1", lessons: [{ exercises: [{ type: "select", id: "a" }, { type: "select", id: "b" }] }] }] }],
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
      readings: { readings: [{ id: "x.read.r", lexemeRefs: ["x:w:3"] }] },
      listening: { clips: [{ id: "x.clip.c", lexemeRefs: [] }] },
      stories: [{ band: "A1-2", lexemes: ["x:w:4", "x:w:99"] }],
    });
    expect(report.syllabus).toBe(5);
    expect(report.withContext).toBe(3);
    expect(report.share).toBe(0.6);
    expect(report.bySource).toEqual({ lessons: 1, readings: 1, listening: 0, stories: 1 });
    expect(report.aboveLevelOnly).toBe(0);
    expect(report.units).toEqual([
      { unitId: "u1", total: 2, withContext: 1, missing: ["x:w:2"], aboveLevelOnly: [] },
      { unitId: "u2", total: 3, withContext: 2, missing: ["x:w:5"], aboveLevelOnly: [] },
    ]);
  });
});

describe("level-correct context (QC 2026-10-29 evening §2)", () => {
  const syllabus = {
    level: "A1",
    entries: [
      { lexemeId: "x:w:1", unitId: "u1" },
      { lexemeId: "x:w:2", unitId: "u1" },
      { lexemeId: "x:w:3", unitId: "u2" },
      { lexemeId: "x:w:4", unitId: "u3" },
    ],
  };
  const base: ContextCoverageInput = { syllabus, packs: [], gradeTargets: () => undefined, readings: null, listening: null, stories: [] };

  test("bands compare by CEFR level: A1-1 and A1-2 are both A1, A2-1 is above it", () => {
    expect(cefrLevel("A1-2")).toBe("A1");
    expect(levelCorrect("A1-2", "A1-1")).toBe(true);
    expect(levelCorrect("A1-1", "A1-2")).toBe(true);
    expect(levelCorrect("A2-1", "A1-2")).toBe(false);
    expect(levelCorrect("A1-2", "A2-1")).toBe(true);
  });

  test("an A1 lexeme met only in an A2-1 story has no context, and the gate fails", () => {
    const only = { ...base, stories: [{ band: "A2-1" as const, lexemes: ["x:w:1", "x:w:2", "x:w:3", "x:w:4"] }, { band: "A1-2" as const, lexemes: ["x:w:2", "x:w:3", "x:w:4"] }] };
    const report = computeContextCoverage(only);
    expect(report.withContext).toBe(3);
    expect(report.aboveLevelOnly).toBe(1);
    expect(report.bySource.stories).toBe(3);
    expect(report.units[0]).toEqual({ unitId: "u1", total: 2, withContext: 1, missing: ["x:w:1"], aboveLevelOnly: ["x:w:1"] });
    expect(contextGateErrors("x", report, { version: 1, uncovered: {} })).toEqual([
      "context-gate (x): x:w:1 (u1) has context only above its level A1 — add a sentence to a source at its level",
    ]);
  });

  test("the mutation: moving the only A1-2 story of a word to A2-1 breaks a passing gate", () => {
    const passing = { ...base, stories: [{ band: "A1-2" as const, lexemes: ["x:w:1", "x:w:2", "x:w:3", "x:w:4"] }, { band: "A2-1" as const, lexemes: ["x:w:4"] }] };
    expect(contextGateErrors("x", computeContextCoverage(passing), { version: 1, uncovered: {} })).toEqual([]);
    const mutated = { ...passing, stories: passing.stories.map((s) => ({ ...s, band: "A2-1" as const })) };
    const errors = contextGateErrors("x", computeContextCoverage(mutated), { version: 1, uncovered: {} });
    expect(errors).toHaveLength(4);
    for (const e of errors) expect(e).toContain("only above its level");
  });

  test("units take the lowest band of the syllabus entries they introduce; a unit with none inherits the one before", () => {
    // 4 entries: x:w:1, x:w:2 → A1-1; x:w:3, x:w:4 → A1-2.
    const p = { sections: [{ units: [{ id: "u0" }, { id: "u1" }, { id: "u2" }, { id: "ux" }, { id: "u3" }] }] } as unknown as PackSource;
    expect([...unitBands(syllabus, [p])]).toEqual([["u0", "A1-1"], ["u1", "A1-1"], ["u2", "A1-2"], ["ux", "A1-2"], ["u3", "A1-2"]]);
  });

  test("a reading or clip takes the band of the earliest unit using it, else the level's last band; both are A1 context", () => {
    const p = {
      sections: [{ units: [
        { id: "u1", lessons: [{ exercises: [{ type: "readingComprehension", id: "e1", readingId: "x.read.r" }] }] },
        { id: "u3", lessons: [{ exercises: [{ type: "listeningComprehension", id: "e2", clipId: "x.clip.c" }] }] },
      ] }],
    } as unknown as PackSource;
    const report = computeContextCoverage({
      ...base,
      packs: [p],
      readings: { readings: [{ id: "x.read.r", lexemeRefs: ["x:w:1"] }, { id: "x.read.exam", lexemeRefs: ["x:w:2"] }] },
      listening: { clips: [{ id: "x.clip.c", lexemeRefs: ["x:w:3"] }] },
      stories: [{ band: "A2-1", lexemes: ["x:w:4"] }],
    });
    expect(report.bySource).toEqual({ lessons: 0, readings: 2, listening: 1, stories: 0 });
    expect(report.units.flatMap((u) => u.aboveLevelOnly)).toEqual(["x:w:4"]);
  });

  test("an A2 syllabus counts A1 and A2 sources", () => {
    const a2 = { level: "A2", entries: [{ lexemeId: "x:w:1", unitId: "u1" }, { lexemeId: "x:w:2", unitId: "u1" }] };
    const report = computeContextCoverage({ ...base, syllabus: a2, stories: [{ band: "A1-2", lexemes: ["x:w:1"] }, { band: "A2-2", lexemes: ["x:w:2"] }] });
    expect(report.withContext).toBe(2);
  });
});

describe("level-correct context on the committed Spanish course", () => {
  const packs = loadPacks();
  const syllabus = loadSyllabus("es")!;
  const lexicon = loadRichLexicon("es");
  const stories = loadStories("es")!;
  const lookup = { ...(loadLegacyMaps(packs).es ?? {}), ...loadIdMaps(packs).es };
  const analyses = validateStories({ lang: "es", stories, lexicon, syllabus, nativeCodes: [], receptionVoices: null }).analyses;
  const input = (band: (b: StoryBand) => StoryBand): ContextCoverageInput => ({
    syllabus,
    packs: packsForTarget("es", packs).map((p) => p.pack),
    gradeTargets: (e) => gradeTargetsFor(e, lookup),
    readings: loadReadings("es"),
    listening: loadListening("es"),
    stories: analyses.map((a) => ({ band: band(a.band), lexemes: a.lexemes })),
  });
  const gate = readJson(contextGatePath("es")) as ContextGate;

  test("every A1 lexeme has an A1 context: the gate passes", () => {
    const report = computeContextCoverage(input((b) => b));
    expect(report.aboveLevelOnly).toBe(0);
    expect(contextGateErrors("es", report, gate)).toEqual([]);
  });

  test("the mutation: with every story moved to A2-1, the A1 words met only in stories fail the gate", () => {
    const errors = contextGateErrors("es", computeContextCoverage(input(() => "A2-1")), gate);
    expect(errors.length).toBeGreaterThan(0);
    for (const e of errors) expect(e).toContain("has context only above its level A1");
  });
});

describe("context gate (QC 2026-10-29 §1.1)", () => {
  const coverage = computeContextCoverage({
    syllabus: { level: "A1", entries: [{ lexemeId: "x:w:1", unitId: "u1" }, { lexemeId: "x:w:2", unitId: "u1" }, { lexemeId: "x:w:3", unitId: "u2" }] },
    packs: [],
    gradeTargets: () => undefined,
    readings: { readings: [{ id: "x.read.r", lexemeRefs: ["x:w:1"] }] },
    listening: null,
    stories: [],
  });

  test("every syllabus lexeme without context and not listed is an error", () => {
    expect(contextGateErrors("x", coverage, { version: 1, uncovered: {} })).toEqual([
      "context-gate (x): x:w:2 (u1) has no context sentence — write one, or list it with a reason in lexicon/context-uncovered.json",
      "context-gate (x): x:w:3 (u2) has no context sentence — write one, or list it with a reason in lexicon/context-uncovered.json",
    ]);
  });

  test("a listed lexeme passes; a listed lexeme that has context, or a short reason, is an error", () => {
    expect(contextGateErrors("x", coverage, { version: 1, uncovered: { "x:w:2": "proper name, no sentence", "x:w:3": "taught in A2 stories" } })).toEqual([]);
    expect(contextGateErrors("x", coverage, { version: 1, uncovered: { "x:w:1": "stale entry here", "x:w:2": "no", "x:w:3": "taught in A2 stories" } })).toEqual([
      "context-gate (x): x:w:1 is listed as uncovered but has context — remove it",
      "context-gate (x): x:w:2 needs a reason of at least 10 characters",
    ]);
  });
});
