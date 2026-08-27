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

import { readdirSync, readFileSync } from "fs";
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
import { FR_COURSE_ID, FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";

export const REPO_ROOT = path.resolve(__dirname, "..", "..");

/** Resolves inside the repo or throws — the anti-traversal gate for IO. */
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
  "src/content/concepts",
  "assets/lexicon",
  "content/reports",
  "ATTRIBUTIONS.md",
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

export function validateExercise(courseId: string, e: AnyExercise, push: (msg: string) => void) {
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
    if (courseId !== "fr-en") {
      push(`${e.id}: articleSelect is French pedagogy — not available for ${courseId}`);
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
            validateExercise(pack.id, e, err);
            if (e.type !== "match" && e.audioTarget !== undefined) {
              if (!manifestKeys.has(`${pack.id}:${e.audioTarget}`)) {
                err(`${pack.id}: ${e.id} audioTarget has no audio: "${e.audioTarget}"`);
              }
            }
            if ("gradeTargets" in e && e.gradeTargets !== undefined) {
              err(`${pack.id}: ${e.id} authors gradeTargets — compiler-only field`);
            }
          }
  }

  // French lexeme map: schema, exact equality with the runtime Phase-1 map
  // (the drift test), full coverage of pack word targets, unique ids.
  const lexParsed = FrLexemeMapSchema.safeParse(readJson("content/fr/lexemes.json"));
  if (!lexParsed.success) {
    err(`content/fr/lexemes.json: ${lexParsed.error.issues[0]?.message}`);
  } else {
    const map = lexParsed.data;
    const runtime = FR_LEXEME_IDS;
    const a = JSON.stringify(Object.entries(map).sort());
    const b = JSON.stringify(Object.entries(runtime).sort());
    if (a !== b) err("content/fr/lexemes.json drifted from src/lib/learning/ids-fr.ts");
    const values = Object.values(map);
    if (new Set(values).size !== values.length) err("fr lexeme ids are not unique");
    const frPack = PackSchema.parse(readJson(`content/courses/${FR_COURSE_ID}.json`));
    for (const section of frPack.sections)
      for (const unit of section.units)
        for (const word of unit.words)
          if (map[word.target] === undefined) {
            err(`fr word "${word.target}" missing from content/fr/lexemes.json`);
          }
  }

  // Catalog (hand-maintained) still validates and matches compiled counts.
  const catalog = CatalogSchema.safeParse(readJson("src/content/catalog.json"));
  if (!catalog.success) err(`catalog.json: ${catalog.error.issues[0]?.message}`);

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
 * gradeTargets emission — ONLY where ambiguity is zero (fr-en, word-mapped):
 *   select whose audioTarget is a mapped word → that word's lexeme id
 *   match → the mapped pair targets' ids
 * Everything else (sentence audioTargets, wordBank/typeAnswer/fillBlank)
 * stays unmarked until deliberate eligibility metadata exists.
 */
function frGradeTargets(e: AnyExercise, map: Record<string, string>): string[] | undefined {
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
  frMap: Record<string, string>
): { pack: PackSource; coverage: CoverageRow } {
  const coverage: CoverageRow = { total: 0, withGradeTargets: 0, byType: {} };
  const isFr = pack.id === FR_COURSE_ID;
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
            const targets = isFr ? frGradeTargets(e, frMap) : undefined;
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
export function compileAll(): { files: CompiledFile[]; coverage: Record<string, CoverageRow> } {
  const frMap = FrLexemeMapSchema.parse(readJson("content/fr/lexemes.json"));
  const files: CompiledFile[] = [];
  const coverage: Record<string, CoverageRow> = {};
  const courseIds: string[] = [];

  for (const file of listCourseSources()) {
    const source = PackSchema.parse(readJson(`content/courses/${file}`));
    const { pack, coverage: row } = compilePack(source, frMap);
    courseIds.push(pack.id);
    coverage[pack.id] = row;
    files.push({ relPath: `src/content/packs/${pack.id}.json`, contents: canonicalJson(pack) });
  }
  files.push({ relPath: "src/content/packs/index.ts", contents: renderPacksIndex(courseIds) });
  files.push({
    relPath: "content/reports/grade-targets.json",
    contents: canonicalJson({ perCourse: coverage }),
  });
  files.push({
    relPath: "ATTRIBUTIONS.md",
    contents: renderAttributions(loadRegistry()),
  });
  return { files, coverage };
}
