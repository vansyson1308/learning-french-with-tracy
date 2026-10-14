/**
 * Content pipeline core (Phase 2). Pure functions over the content/ source
 * tree; the thin CLIs in scripts/ call these. Rules this module enforces:
 *
 * - content/ is the source of truth; src/content/packs/*.json, packs/index.ts,
 *   ATTRIBUTIONS.md and content/reports/ are GENERATED artifacts (committed,
 *   drift-guarded in CI). catalog.json stays hand-maintained; the legacy
 *   audio manifest is an immutable baseline, never regenerated here.
 * - Deterministic output: same input bytes → same output bytes. No
 *   timestamps, no randomness, no network. CI makes zero paid API calls.
 * - Writes go only to the declared generated targets; every path is
 *   containment-checked against the repo root (no traversal, no eval).
 */

import { existsSync, readdirSync, readFileSync, rmSync } from "fs";
import path from "path";

import {
  ALLOWED_LICENSES,
  CatalogSchema,
  FrLexemeMapSchema,
  PackSchema,
  SourceRegistrySchema,
  type PackSource,
  type SourceRegistry,
} from "../../content/schema";
import { BUILD_LANGUAGES } from "./languages";

export const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Resolves inside the repo or throws — the anti-traversal gate for IO. */
/**
 * Remove a temp directory that briefly held a SQLite file. On Windows the
 * handle can outlive `db.close()` (or an on-access scanner holds it) for a
 * few hundred ms, which makes a plain rmSync throw EBUSY; retrying is the
 * documented Node remedy.
 */
export function removeTempDirSync(dir: string): void {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

export function safeResolve(...segments: string[]): string {
  const resolved = path.resolve(REPO_ROOT, ...segments);
  if (resolved !== REPO_ROOT && !resolved.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`path escapes the repository: ${segments.join("/")}`);
  }
  return resolved;
}

/** The only paths compile is allowed to write. */
export const GENERATED_TARGETS = [
  "src/content/packs",
  "src/content/lexicon",
  "src/content/ids",
  "src/content/artifacts",
  "src/content/course-profiles.json",
  "src/content/flags.ts",
  "src/content/concepts",
  "src/content/assessment",
  "src/content/reception",
  "src/content/speech",
  "src/content/writing",
  "src/content/interaction",
  "assets/lexicon",
  "content/reports",
  "ATTRIBUTIONS.md",
  "src/content/attributions.json",
] as const;

export function assertGeneratedTarget(relPath: string): void {
  const abs = safeResolve(relPath);
  const ok = GENERATED_TARGETS.some((t) => {
    const base = safeResolve(t);
    return abs === base || abs.startsWith(base + path.sep);
  });
  if (!ok) throw new Error(`refusing to write outside generated targets: ${relPath}`);
}

/** Canonical JSON emit — proven byte-identical to the shipped pack format. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function readJson(relPath: string): unknown {
  return JSON.parse(readFileSync(safeResolve(relPath), "utf8"));
}

export function listCourseSources(): string[] {
  return readdirSync(safeResolve("content/courses"))
    .filter((f) => f.endsWith(".json"))
    .sort();
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult = { errors: string[]; warnings: string[] };

type AnyExercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];

/**
 * Which rich layers a TARGET language's authored sources provide (P1b):
 * the exercise types that need them are allowed in a pack exactly when the
 * layer exists for that language — no course literal anywhere.
 */
export function targetLayers(targetCode: string): {
  reception: boolean;
  pedagogy: boolean;
  ids: boolean;
  numberDrill: NonNullable<(typeof BUILD_LANGUAGES)[string]["numberDrill"]> | undefined;
} {
  return {
    reception: existsSync(safeResolve(`content/${targetCode}/reception`)),
    pedagogy: existsSync(safeResolve(`content/${targetCode}/pedagogy`)),
    ids: existsSync(safeResolve(`content/${targetCode}/lexemes.json`)),
    numberDrill: BUILD_LANGUAGES[targetCode]?.numberDrill,
  };
}

/** Course ids are `<target>-<native>` (CLAUDE.md conventions). */
export function targetCodeOf(courseId: string): string {
  return courseId.split("-")[0] ?? courseId;
}

export function validateExercise(
  courseId: string,
  e: AnyExercise,
  push: (msg: string) => void,
  targetCode: string = targetCodeOf(courseId)
) {
  const layers = targetLayers(targetCode);
  // Number-drill agreement (Phase 5B §75-80): any exercise of a language
  // with a verified number speller whose prompt is a bare integer 0-100 is
  // a number drill, and its expected answer must agree with the
  // deterministic engine — the pack can never drift from the spelling rules.
  const speller = layers.numberDrill;
  if (speller) {
    const numeric = (s: string) => (/^\d{1,3}$/.test(s) ? Number(s) : null);
    if (e.type === "typeAnswer" && e.mode === "produceTarget") {
      const n = numeric(e.prompt);
      if (n !== null && n >= 0 && n <= 100) {
        const accepted = speller.accepted(n);
        if (e.answer !== accepted[0] || JSON.stringify(e.alternatives) !== JSON.stringify(accepted.slice(1))) {
          push(
            `${e.id}: number drill for ${n} must accept exactly [${accepted.join(", ")}] (engine spelling), got answer "${e.answer}" alternatives [${e.alternatives.join(", ")}]`
          );
        }
      }
    }
    if (e.type === "select") {
      const n = numeric(e.prompt);
      if (n !== null && n >= 0 && n <= 100) {
        const expected = speller.expected(n);
        if (e.options[e.correct]?.text !== expected) {
          push(
            `${e.id}: digit→word select for ${n} must key "${expected}" (engine spelling), got "${e.options[e.correct]?.text}"`
          );
        }
      }
    }
  }
  if (e.type === "select") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    const texts = e.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) push(`${e.id}: duplicate option text`);
  }
  if (e.type === "fillBlank") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    if (new Set(e.options).size !== e.options.length) push(`${e.id}: duplicate options`);
  }
  if (e.type === "wordBank") {
    const tokens = [...e.tokens];
    for (const word of e.answer) {
      const at = tokens.indexOf(word);
      if (at === -1) {
        push(`${e.id}: answer token "${word}" missing from tokens`);
        return;
      }
      tokens.splice(at, 1);
    }
  }
  if (e.type === "match") {
    const targets = e.pairs.map((p) => p.target);
    if (new Set(targets).size !== targets.length) push(`${e.id}: duplicate pair target`);
  }
  if (e.type === "listeningComprehension" || e.type === "readingComprehension") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    const texts = e.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) push(`${e.id}: duplicate option text`);
    if (!layers.reception) {
      push(`${e.id}: ${e.type} needs authored reception content (content/${targetCode}/reception) — not available for ${courseId}`);
    }
  }
  if (e.type === "dictation") {
    if (!layers.reception) {
      push(`${e.id}: dictation needs authored reception content (content/${targetCode}/reception) — not available for ${courseId}`);
    }
  }
  if (e.type === "articleSelect") {
    if (e.correct >= e.articles.length) push(`${e.id}: correct index out of range`);
    if (new Set(e.articles).size !== e.articles.length) push(`${e.id}: duplicate articles`);
    // §57 elision safety: le/la cannot be drilled on a noun that takes l'
    // (vowel- or h-initial — h aspiré vs muet is exactly the ambiguity the
    // program says generated exercises must avoid).
    const elisionSensitive = e.articles.some((a) => a === "le" || a === "la");
    if (elisionSensitive && /^[aeiouyâàäéèêëîïôöûüœh]/i.test(e.noun)) {
      push(
        `${e.id}: le/la drill on vowel/h-initial noun "${e.noun}" — such nouns elide to l' (or hide h-aspiré ambiguity); use un/une or a consonant-initial noun`
      );
    }
    if (!layers.pedagogy) {
      push(`${e.id}: articleSelect needs authored pedagogy (content/${targetCode}/pedagogy) — not available for ${courseId}`);
    }
  }
}

function audioManifestKeys(): Set<string> {
  const manifest = readFileSync(safeResolve("src/content/audio-manifest.ts"), "utf8");
  const keys = new Set<string>();
  for (const m of manifest.matchAll(/^\s*"((?:[^"\\]|\\.)*)": require\(/gm)) {
    keys.add(JSON.parse(`"${m[1]}"`));
  }
  return keys;
}

export function validateContent(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  const manifestKeys = audioManifestKeys();
  const seenPackIds = new Set<string>();

  for (const file of listCourseSources()) {
    const parsed = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 5)) {
        err(`${file}: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }
    const pack = parsed.data;
    if (pack.id !== file.replace(/\.json$/, "")) err(`${file}: id "${pack.id}" ≠ filename`);
    if (seenPackIds.has(pack.id)) err(`${file}: duplicate pack id`);
    seenPackIds.add(pack.id);

    const ids = new Set<string>();
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const lesson of unit.lessons)
          for (const e of lesson.exercises) {
            if (ids.has(e.id)) err(`${pack.id}: duplicate exercise id ${e.id}`);
            ids.add(e.id);
            validateExercise(pack.id, e, err, pack.targetCode);
            if ("audioTarget" in e && e.audioTarget !== undefined) {
              // device-tts courses (no license-clean voice exists for the
              // language) carry no bundled audio by policy; the runtime
              // speaks their audioTargets through the device voice.
              if (pack.audio?.policy !== "device-tts" && !manifestKeys.has(`${pack.id}:${e.audioTarget}`)) {
                err(`${pack.id}: ${e.id} audioTarget has no audio: "${e.audioTarget}"`);
              }
            }
            if ("gradeTargets" in e && e.gradeTargets !== undefined) {
              err(`${pack.id}: ${e.id} authors gradeTargets — compiler-only field`);
            }
          }
  }

  // Frozen lexeme maps (P1b, every language that has one): schema, unique
  // ids, exact equality with the COMMITTED generated registry (the drift
  // test — stable ids are persisted in learner data), and full coverage of
  // every pack word of a course in that language.
  for (const file of listCourseSources()) {
    const pack = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (!pack.success) continue;
    const code = pack.data.targetCode;
    const rel = `content/${code}/lexemes.json`;
    if (!existsSync(safeResolve(rel))) continue;
    const parsed = FrLexemeMapSchema.safeParse(readJson(rel));
    if (!parsed.success) {
      err(`${rel}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const map = parsed.data;
    const values = Object.values(map);
    if (new Set(values).size !== values.length) err(`${code} lexeme ids are not unique`);
    const generatedRel = `src/content/ids/${code}.json`;
    if (existsSync(safeResolve(generatedRel))) {
      const generated = (readJson(generatedRel) as { surfaceToId: Record<string, string> }).surfaceToId;
      const a = JSON.stringify(Object.entries(map).sort());
      const b = JSON.stringify(Object.entries(generated).sort());
      if (a !== b) err(`${rel} drifted from ${generatedRel} — run bun run content:compile`);
    }
    for (const section of pack.data.sections)
      for (const unit of section.units)
        for (const word of unit.words)
          if (map[word.target] === undefined) {
            err(`${code} word "${word.target}" missing from ${rel}`);
          }
  }

  // Catalog (hand-maintained) still validates — and its advertised counts
  // must MATCH each pack (P9.10: the French row silently rotted at Phase
  // 5B's "10 units · 40 lessons" while the course grew to 27/108; a
  // hand-maintained display number needs a machine check).
  const catalog = CatalogSchema.safeParse(readJson("src/content/catalog.json"));
  if (!catalog.success) err(`catalog.json: ${catalog.error.issues[0]?.message}`);
  if (catalog.success) {
    for (const course of catalog.data.courses) {
      const pack = PackSchema.safeParse(readJson(`content/courses/${course.id}.json`));
      if (!pack.success) continue; // pack schema errors are reported elsewhere
      const units = pack.data.sections.reduce((n, s) => n + s.units.length, 0);
      const lessons = pack.data.sections.reduce(
        (n, s) => n + s.units.reduce((m, u) => m + u.lessons.length, 0),
        0
      );
      if (course.unitCount !== units || course.lessonCount !== lessons) {
        err(
          `catalog.json: ${course.id} advertises ${course.unitCount} units · ${course.lessonCount} lessons but the pack has ${units} · ${lessons}`
        );
      }
    }
  }

  errors.push(...validateRegistry().errors);
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export function validateRegistry(): ValidationResult {
  const errors: string[] = [];
  const parsed = SourceRegistrySchema.safeParse(readJson("content/sources/registry.json"));
  if (!parsed.success) {
    errors.push(`registry: ${parsed.error.issues[0]?.path.join(".")} — ${parsed.error.issues[0]?.message}`);
    return { errors, warnings: [] };
  }
  const registry = parsed.data;
  const sourceIds = registry.sources.map((s) => s.id);
  if (new Set(sourceIds).size !== sourceIds.length) errors.push("registry: duplicate source ids");
  for (const s of registry.sources) {
    if (!ALLOWED_LICENSES.includes(s.license)) {
      errors.push(`registry: license "${s.license}" is not allowlisted — do not ingest`);
    }
  }
  const covered = (rel: string) =>
    registry.sources.some((s) => s.covers.some((c) => rel === c || rel.startsWith(c)));
  for (const file of listCourseSources()) {
    if (!covered(`content/courses/${file}`)) {
      errors.push(`provenance gap: content/courses/${file} has no registered source`);
    }
  }
  if (!covered("assets/audio/")) errors.push("provenance gap: assets/audio/ uncovered");
  return { errors, warnings: [] };
}

export function loadRegistry(): SourceRegistry {
  return SourceRegistrySchema.parse(readJson("content/sources/registry.json"));
}

export function renderAttributions(registry: SourceRegistry): string {
  const lines: string[] = [
    "<!-- Generated by scripts/compile-content.ts from content/sources/registry.json — do not edit by hand. -->",
    "",
    "# Attributions",
    "",
    "This file lists third-party sources this app builds on, generated from the",
    "provenance registry. It supplements — and never replaces — the repository's",
    "`LICENSE`; all existing copyright and MIT notices are preserved as-is.",
    "",
  ];
  for (const s of [...registry.sources].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`## ${s.name}`);
    lines.push("");
    lines.push(`- **License:** ${s.license}`);
    lines.push(`- **Source:** ${s.url}`);
    lines.push(`- **What:** ${s.kind}`);
    lines.push(`- **Retrieved:** ${s.retrievedAt}`);
    lines.push("");
    lines.push(s.attribution);
    if (s.notes) {
      lines.push("");
      lines.push(`> ${s.notes}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

export type CompiledFile = { relPath: string; contents: string };
export type CoverageRow = {
  total: number;
  withGradeTargets: number;
  byType: Record<string, { total: number; withGradeTargets: number }>;
};

/**
 * gradeTargets emission — ONLY where ambiguity is zero (courses whose
 * target language has a stable-id registry, word-mapped surfaces):
 *   select whose audioTarget is a mapped word → that word's lexeme id
 *   match → the mapped pair targets' ids
 * Everything else (sentence audioTargets, wordBank/typeAnswer/fillBlank)
 * stays unmarked until deliberate eligibility metadata exists.
 */
function gradeTargetsFor(e: AnyExercise, map: Record<string, string>): string[] | undefined {
  if (e.type === "select") {
    // The exercise's unambiguous French surface: bundled-audio lessons key
    // it by audioTarget (Section 1); audio-less lessons key it by what the
    // select actually shows — the French prompt (target→native) or the
    // correct French option (native→target). Listen mode without audio can
    // never be unambiguous.
    const surface =
      e.audioTarget ??
      (e.mode === "targetToNative"
        ? e.prompt
        : e.mode === "nativeToTarget"
          ? e.options[e.correct]?.text
          : undefined);
    if (surface === undefined) return undefined;
    const id = map[surface];
    return id === undefined ? undefined : [id];
  }
  if (e.type === "match") {
    const ids = e.pairs.map((p) => map[p.target]).filter((v): v is string => v !== undefined);
    return ids.length > 0 ? [...new Set(ids)] : undefined;
  }
  return undefined;
}

export function compilePack(
  pack: PackSource,
  /** The target language's frozen surface → id map; undefined = no registry (legacy course). */
  idMap: Record<string, string> | undefined
): { pack: PackSource; coverage: CoverageRow } {
  const coverage: CoverageRow = { total: 0, withGradeTargets: 0, byType: {} };
  const out: PackSource = {
    ...pack,
    sections: pack.sections.map((section) => ({
      ...section,
      units: section.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => ({
          ...lesson,
          exercises: lesson.exercises.map((e) => {
            coverage.total += 1;
            const byType = (coverage.byType[e.type] ??= { total: 0, withGradeTargets: 0 });
            byType.total += 1;
            const targets = idMap ? gradeTargetsFor(e, idMap) : undefined;
            if (targets === undefined) return { ...e };
            coverage.withGradeTargets += 1;
            byType.withGradeTargets += 1;
            return { ...e, gradeTargets: targets };
          }),
        })),
      })),
    })),
  };
  return { pack: out, coverage };
}

const INDEX_HEADER = "// Generated by scripts/compile-content.ts — do not edit.";

function renderPacksIndex(courseIds: string[]): string {
  const imports = courseIds
    .map((id) => `import ${id.replace(/-/g, "_")} from "./${id}.json";`)
    .join("\n");
  const entries = courseIds
    .map((id) => `  "${id}": ${id.replace(/-/g, "_")} as Pack,`)
    .join("\n");
  return `${INDEX_HEADER}\n${imports}\nimport type { Pack } from "../../lib/types";\n\nexport const PACKS: Record<string, Pack> = {\n${entries}\n};\n`;
}

/** Pure compile: returns every generated artifact as (relPath, bytes). */
/** Frozen surface → id maps per target language that has one (content/<code>/lexemes.json). */
export function loadIdMaps(): Record<string, Record<string, string>> {
  const maps: Record<string, Record<string, string>> = {};
  for (const file of listCourseSources()) {
    const code = targetCodeOf(file.replace(/\.json$/, ""));
    if (maps[code] !== undefined) continue;
    const rel = `content/${code}/lexemes.json`;
    if (!existsSync(safeResolve(rel))) continue;
    const parsed = readJson(rel) as Record<string, string>;
    const regex = new RegExp(`^${code}:w:[a-z0-9-]+$`);
    for (const [surface, id] of Object.entries(parsed)) {
      if (typeof id !== "string" || !regex.test(id)) throw new Error(`${rel}: "${surface}" → "${String(id)}" is not a ${code}:w:<slug> id`);
    }
    maps[code] = parsed;
  }
  return maps;
}

export function compileAll(): {
  files: CompiledFile[];
  coverage: Record<string, CoverageRow>;
  packs: PackSource[];
  idMaps: Record<string, Record<string, string>>;
} {
  const idMaps = loadIdMaps();
  const files: CompiledFile[] = [];
  const coverage: Record<string, CoverageRow> = {};
  const courseIds: string[] = [];
  const packs: PackSource[] = [];

  for (const file of listCourseSources()) {
    const source = PackSchema.parse(readJson(`content/courses/${file}`));
    const { pack, coverage: row } = compilePack(source, idMaps[source.targetCode]);
    courseIds.push(pack.id);
    packs.push(source);
    coverage[pack.id] = row;
    files.push({ relPath: `src/content/packs/${pack.id}.json`, contents: canonicalJson(pack) });
  }
  files.push({ relPath: "src/content/packs/index.ts", contents: renderPacksIndex(courseIds) });
  files.push({
    relPath: "content/reports/grade-targets.json",
    contents: canonicalJson({ perCourse: coverage }),
  });
  const registry = loadRegistry();
  files.push({
    relPath: "ATTRIBUTIONS.md",
    contents: renderAttributions(registry),
  });
  // In-app attributions (V1 publication): the Licenses screen renders every
  // registry entry — CC BY voices and CC BY-SA data are credited inside the
  // product, not only in the repository.
  files.push({
    relPath: "src/content/attributions.json",
    contents: canonicalJson({
      generator: "scripts/compile-content.ts",
      sources: registry.sources.map((e) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        license: e.license,
        url: e.url,
        attribution: e.attribution,
        covers: e.covers,
      })),
    }),
  });
  return { files, coverage, packs, idMaps };
}
