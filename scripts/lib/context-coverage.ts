/**
 * Context coverage (coordinator QC 2026-10-28 §4; the P3f context rule):
 * every syllabus lexeme should meet the learner in at least one context —
 * a lesson exercise that grades it, a reading or listening clip that
 * references it, or a graded story that uses it. The report lists, unit by
 * unit, the syllabus lexemes with NO context, so stories can be written to
 * close the gap (content/reports/<lang>/context-coverage.json). It becomes
 * a gate for a target that commits lexicon/context-uncovered.json (below).
 *
 * Level-correct context (QC 2026-10-29 evening §2): a context counts only
 * when its source's band is at or below the lexeme's level — an A1 word
 * met only in an A2-1 story has no context for an A1 learner. Bands
 * (STORY_BANDS, "A1-1" … "A2-2") are known per source as follows:
 *
 *  - lexeme: its position in the target syllabus (`lexemeBands`: first half
 *    of the level `<L>-1`, second half `<L>-2`) — the same bands the story
 *    grader uses;
 *  - lesson exercise: the band of its unit. A course unit sits at the
 *    syllabus level; within it, a unit takes the lowest band of the syllabus
 *    entries it introduces (the syllabus unit map), and a unit introducing
 *    none takes the band of the unit before it (the first: `<L>-1`);
 *  - reading / listening clip: the band of the earliest unit whose lesson
 *    exercise references it (readingId, clipId, modelClipId …). One no lesson
 *    uses — a checkpoint, placement or exam-track stimulus — is assessment of
 *    the level and takes the level's last band (`<L>-2`);
 *  - story: its declared `band`.
 *
 * Bands are compared by CEFR level (A1-1 and A1-2 are both A1): the half
 * split grades a story's vocabulary, while an A1 lexeme is level-correct in
 * any A1 source — it needs at least one sentence in an A1-1 or A1-2 lesson,
 * reading, clip or story. The rule is generic: an A2 syllabus is held to
 * A2-1/A2-2 sources (and below) the same way.
 */
import { STORY_BANDS, type PackSource, type StoryBand } from "../../content/schema";

import { lexemeBands } from "./stories";

type AnyExercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];

export type ContextCoverageInput = {
  syllabus: { level: string; entries: { lexemeId: string; unitId: string }[] };
  /** Compiled packs' exercises carry gradeTargets; source packs are graded through `gradeTargets`. */
  packs: PackSource[];
  gradeTargets: (e: AnyExercise) => string[] | undefined;
  readings: { readings: { id: string; lexemeRefs?: string[] }[] } | null;
  listening: { clips: { id: string; lexemeRefs?: string[] }[] } | null;
  /** Distinct lexemes per analysed story, with the story's band. */
  stories: { band: StoryBand; lexemes: string[] }[];
};

export type ContextCoverage = {
  generator: string;
  rule: string;
  level: string;
  syllabus: number;
  withContext: number;
  share: number;
  /** Syllabus lexemes with level-correct context from each kind of source. */
  bySource: { lessons: number; readings: number; listening: number; stories: number };
  /** Syllabus lexemes whose only context is above their level (counted as missing). */
  aboveLevelOnly: number;
  units: { unitId: string; total: number; withContext: number; missing: string[]; aboveLevelOnly: string[] }[];
};

const RULE =
  "a syllabus lexeme has context when a lesson exercise grades it, a reading or listening clip references it, or a graded story uses it — " +
  "counted only from sources whose band is at or below the lexeme's CEFR level (lesson: its unit's band; reading/clip: the earliest unit using it, else the level's last band; story: its band)";

/** CEFR level of a band or level string ("A1-2" → "A1"). */
export function cefrLevel(band: string): string {
  return band.toUpperCase().split("-")[0];
}

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const levelRank = (band: string) => {
  const i = LEVELS.indexOf(cefrLevel(band));
  return i < 0 ? LEVELS.length : i;
};

/** A source of band `source` is level-correct context for a lexeme of band `lexeme` (pure; tested). */
export function levelCorrect(source: string, lexeme: string): boolean {
  return levelRank(source) <= levelRank(lexeme);
}

/** Bands in order ("A1-1" < "A1-2" < "A2-1" …); a band outside STORY_BANDS sorts last. */
const bandIndex = (band: string) => {
  const i = (STORY_BANDS as readonly string[]).indexOf(band);
  return i < 0 ? STORY_BANDS.length : i;
};

/** Unit id → band, per the mapping documented above (pure; tested). */
export function unitBands(syllabus: ContextCoverageInput["syllabus"], packs: PackSource[]): Map<string, string> {
  const lexBand = lexemeBands(syllabus);
  const lowest = new Map<string, string>();
  for (const e of syllabus.entries) {
    const b = lexBand.get(e.lexemeId);
    if (!b) continue;
    const cur = lowest.get(e.unitId);
    if (cur === undefined || bandIndex(b) < bandIndex(cur)) lowest.set(e.unitId, b);
  }
  const out = new Map<string, string>();
  for (const pack of packs) {
    let prev = `${syllabus.level.toUpperCase()}-1`;
    for (const s of pack.sections) {
      for (const u of s.units) {
        prev = lowest.get(u.id) ?? prev;
        out.set(u.id, prev);
      }
    }
  }
  return out;
}

/** Every string value of an exercise (ids of the readings and clips it uses among them). */
function stringsOf(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) stringsOf(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) stringsOf(v, out);
  return out;
}

type Source = { kind: keyof ContextCoverage["bySource"]; band: string };

export function computeContextCoverage(input: ContextCoverageInput): ContextCoverage {
  const lexBand = lexemeBands(input.syllabus);
  const units = unitBands(input.syllabus, input.packs);
  const lastBand = `${input.syllabus.level.toUpperCase()}-2`;
  const sources = new Map<string, Source[]>();
  const add = (id: string, src: Source) => sources.set(id, [...(sources.get(id) ?? []), src]);

  const receptionIds = new Set([...(input.readings?.readings ?? []), ...(input.listening?.clips ?? [])].map((r) => r.id));
  const receptionBand = new Map<string, string>();
  for (const pack of input.packs) {
    for (const s of pack.sections) {
      for (const u of s.units) {
        const band = units.get(u.id) ?? lastBand;
        for (const l of u.lessons) {
          for (const e of l.exercises) {
            for (const id of input.gradeTargets(e as AnyExercise) ?? []) add(id, { kind: "lessons", band });
            for (const ref of stringsOf(e)) {
              if (!receptionIds.has(ref)) continue;
              const cur = receptionBand.get(ref);
              if (cur === undefined || bandIndex(band) < bandIndex(cur)) receptionBand.set(ref, band);
            }
          }
        }
      }
    }
  }
  for (const r of input.readings?.readings ?? []) for (const id of r.lexemeRefs ?? []) add(id, { kind: "readings", band: receptionBand.get(r.id) ?? lastBand });
  for (const c of input.listening?.clips ?? []) for (const id of c.lexemeRefs ?? []) add(id, { kind: "listening", band: receptionBand.get(c.id) ?? lastBand });
  for (const st of input.stories) for (const id of new Set(st.lexemes)) add(id, { kind: "stories", band: st.band });

  // A lexeme outside the syllabus bands (none in practice) is held to the syllabus level.
  const bandOf = (id: string) => lexBand.get(id) ?? lastBand;
  const correct = (id: string) => (sources.get(id) ?? []).filter((s) => levelCorrect(s.band, bandOf(id)));
  const has = (id: string) => correct(id).length > 0;
  const aboveOnly = (id: string) => !has(id) && (sources.get(id) ?? []).length > 0;

  const ids = input.syllabus.entries.map((e) => e.lexemeId);
  const count = (kind: Source["kind"]) => ids.filter((id) => correct(id).some((s) => s.kind === kind)).length;
  const rows: ContextCoverage["units"] = [];
  for (const e of input.syllabus.entries) {
    let row = rows.find((u) => u.unitId === e.unitId);
    if (!row) rows.push((row = { unitId: e.unitId, total: 0, withContext: 0, missing: [], aboveLevelOnly: [] }));
    row.total += 1;
    if (has(e.lexemeId)) row.withContext += 1;
    else {
      row.missing.push(e.lexemeId);
      if (aboveOnly(e.lexemeId)) row.aboveLevelOnly.push(e.lexemeId);
    }
  }
  const withContext = ids.filter(has).length;
  return {
    generator: "scripts/lib/context-coverage.ts",
    rule: RULE,
    level: input.syllabus.level,
    syllabus: ids.length,
    withContext,
    share: ids.length === 0 ? 1 : Math.round((withContext / ids.length) * 10_000) / 10_000,
    bySource: { lessons: count("lessons"), readings: count("readings"), listening: count("listening"), stories: count("stories") },
    aboveLevelOnly: ids.filter(aboveOnly).length,
    units: rows,
  };
}

/**
 * QC 2026-10-29 §1.1: a target that commits `content/<lang>/lexicon/context-uncovered.json`
 * opts into the gate — every syllabus lexeme has level-correct context, or is
 * listed there with a reason. A listed lexeme that has context is stale and an error.
 */
export type ContextGate = { version: 1; uncovered: Record<string, string> };

export function contextGatePath(lang: string): string {
  return `content/${lang}/lexicon/context-uncovered.json`;
}

export function contextGateErrors(lang: string, coverage: ContextCoverage, gate: ContextGate): string[] {
  const errors: string[] = [];
  const missing = new Map(coverage.units.flatMap((u) => u.missing.map((id) => [id, u.unitId] as const)));
  const above = new Set(coverage.units.flatMap((u) => u.aboveLevelOnly));
  for (const [id, unit] of missing) {
    if (id in gate.uncovered) continue;
    if (above.has(id)) errors.push(`context-gate (${lang}): ${id} (${unit}) has context only above its level ${coverage.level} — add a sentence to a source at its level`);
    else errors.push(`context-gate (${lang}): ${id} (${unit}) has no context sentence — write one, or list it with a reason in lexicon/context-uncovered.json`);
  }
  for (const [id, reason] of Object.entries(gate.uncovered)) {
    if (!missing.has(id)) errors.push(`context-gate (${lang}): ${id} is listed as uncovered but has context — remove it`);
    else if (reason.trim().length < 10) errors.push(`context-gate (${lang}): ${id} needs a reason of at least 10 characters`);
  }
  return errors;
}

export function compileContextCoverageReport(input: ContextCoverageInput): string {
  return `${JSON.stringify(computeContextCoverage(input), null, 2)}\n`;
}
