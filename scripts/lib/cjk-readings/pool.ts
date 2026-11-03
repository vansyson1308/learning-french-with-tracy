/**
 * Disk side of the CJK pool readings (P4b stage 4): file locations, the
 * rendered derived file, and the validator content:validate runs on every
 * ja/zh/ko candidate pool (every pool entry carries a confirmed reading or
 * is listed in `unresolved` with its reason; every stored reading passes
 * the reading contract; the file matches the pool it was derived from).
 */

import { existsSync } from "fs";

import { LexemeReadingsFileSchema, ReadingsManifestSchema, type LexemeReadingsFile, type ReadingsManifest } from "../../../content/schema";
import { canonicalJson, readJson, safeResolve } from "../pipeline";

import { NOTATION_OF, poolKey, type DerivedReadings, type PoolKeyEntry, type PoolReadings } from "./derive";
import { readingErrors } from "./validate";

export const CJK_READING_LANGS = ["ja", "zh", "ko"] as const;

export const readingsManifestRel = (lang: string) => `content/${lang}/lexicon/readings-manifest.json`;
export const lexemeReadingsRel = (lang: string) => `content/${lang}/lexicon/derived/lexeme-readings.json`;
export const candidatePoolRel = (lang: string) => `content/${lang}/lexicon/derived/candidate-pool.json`;
export const poolReadingsRel = (lang: string) => `content/${lang}/lexicon/derived/readings.json`;

export function loadReadingsManifest(lang: string): ReadingsManifest {
  return ReadingsManifestSchema.parse(readJson(readingsManifestRel(lang)));
}

export function loadPoolEntries(lang: string): PoolKeyEntry[] {
  const pool = readJson(candidatePoolRel(lang)) as { entries: { lemma: string; partOfSpeech: string }[] };
  return pool.entries.map((e) => ({ lemma: e.lemma, partOfSpeech: e.partOfSpeech }));
}

/** The pool's existing readings (derived/readings.json: kaikki, JMdict / CC-CEDICT at pool time) and its source stamps. */
export function loadPoolReadings(lang: string): { readings: PoolReadings; sources: { id: string; sha256: string | null; url: string | null; retrievedAt: string | null }[] } {
  if (!existsSync(safeResolve(poolReadingsRel(lang)))) return { readings: {}, sources: [] };
  const doc = readJson(poolReadingsRel(lang)) as { readings: PoolReadings; sources: { id: string; sha256: string | null; url: string | null; retrievedAt: string | null }[] };
  return { readings: doc.readings, sources: doc.sources };
}

/** The committed derived file for a language's pool (sorted by pool order; unresolved in pool order). */
export function renderLexemeReadings(lang: string, manifest: ReadingsManifest, pool: readonly PoolKeyEntry[], derived: DerivedReadings, poolStamps: ReturnType<typeof loadPoolReadings>["sources"]): string {
  const readings: LexemeReadingsFile["readings"] = {};
  const unresolved: LexemeReadingsFile["unresolved"] = {};
  const ambiguous: Record<string, string[]> = {};
  for (const e of pool) {
    const key = poolKey(e);
    if (derived.readings[key]) readings[key] = derived.readings[key]!;
    else if (derived.unresolved[key]) unresolved[key] = derived.unresolved[key]!;
    if (derived.traditionalAmbiguous?.[key]) ambiguous[key] = derived.traditionalAmbiguous[key]!;
  }
  const stamps = [
    ...manifest.sources.map((s) => ({ id: s.id, sha256: s.sha256, url: s.url, retrievedAt: s.retrievedAt })),
    ...poolStamps.filter((s): s is { id: string; sha256: string; url: string; retrievedAt: string } => s.sha256 !== null && s.url !== null && s.retrievedAt !== null),
  ];
  const file: LexemeReadingsFile = {
    generator: "scripts/cjk-readings.ts",
    language: lang,
    notation: manifest.notation,
    sources: stamps,
    method: manifest.method,
    coverage: { entries: pool.length, confirmed: Object.keys(readings).length, unresolved: Object.keys(unresolved).length },
    readings,
    unresolved,
    ...(Object.keys(ambiguous).length > 0 ? { traditionalAmbiguous: ambiguous } : {}),
  };
  return `${canonicalJson(LexemeReadingsFileSchema.parse(file))}\n`;
}

/** Pure check of a derived readings file against its pool. */
export function poolReadingsErrors(lang: string, file: LexemeReadingsFile, pool: readonly PoolKeyEntry[]): string[] {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`cjk-readings ${lang}: ${m}`);
  const notation = NOTATION_OF[lang];
  if (notation === undefined) return [`cjk-readings ${lang}: no reading notation for this language`];
  if (file.language !== lang) err(`file language "${file.language}" ≠ ${lang}`);
  if (file.notation !== notation) err(`notation "${file.notation}" ≠ ${notation}`);
  const keys = new Map(pool.map((e) => [poolKey(e), e] as const));
  for (const key of Object.keys(file.readings)) if (!keys.has(key)) err(`reading for "${key}", which is not a pool entry — re-derive`);
  for (const key of Object.keys(file.unresolved)) {
    if (!keys.has(key)) err(`unresolved "${key}" is not a pool entry — re-derive`);
    if (file.readings[key]) err(`"${key}" is both read and unresolved`);
  }
  for (const [key, e] of keys) {
    const reading = file.readings[key];
    if (reading === undefined) {
      if (file.unresolved[key] === undefined) err(`"${key}" has no confirmed reading and is not listed in unresolved with a reason`);
      continue;
    }
    for (const m of readingErrors(notation, e.lemma, e.partOfSpeech, reading)) err(`${key}: ${m}`);
    if (lang === "zh" && reading.traditional === undefined && !(file.traditionalAmbiguous?.[key]?.length)) {
      err(`${key}: no traditional spelling and not listed in traditionalAmbiguous`);
    }
  }
  for (const [key, list] of Object.entries(file.traditionalAmbiguous ?? {})) {
    const e = keys.get(key);
    if (!e) err(`traditionalAmbiguous "${key}" is not a pool entry`);
    else for (const t of list) if ([...t].length !== [...e.lemma].length) err(`${key}: traditional candidate "${t}" differs in length`);
  }
  const confirmed = Object.keys(file.readings).length;
  const unresolved = Object.keys(file.unresolved).length;
  if (file.coverage.entries !== pool.length || file.coverage.confirmed !== confirmed || file.coverage.unresolved !== unresolved) {
    err(`coverage ${JSON.stringify(file.coverage)} does not recompute (${pool.length} entries, ${confirmed} confirmed, ${unresolved} unresolved)`);
  }
  return errors;
}

/** content:validate: every ja/zh/ko candidate pool has its readings file and it holds. */
export function validateCjkPoolReadings(): string[] {
  const errors: string[] = [];
  for (const lang of CJK_READING_LANGS) {
    if (!existsSync(safeResolve(candidatePoolRel(lang)))) continue;
    if (!existsSync(safeResolve(readingsManifestRel(lang)))) {
      errors.push(`cjk-readings ${lang}: ${readingsManifestRel(lang)} is missing — the pool's readings have no pinned sources`);
      continue;
    }
    let manifest: ReadingsManifest;
    try {
      manifest = loadReadingsManifest(lang);
    } catch (e) {
      errors.push(`cjk-readings ${lang}: ${readingsManifestRel(lang)} failed schema validation — ${(e as Error).message.split("\n")[0]}`);
      continue;
    }
    if (!existsSync(safeResolve(lexemeReadingsRel(lang)))) {
      errors.push(`cjk-readings ${lang}: ${lexemeReadingsRel(lang)} is missing — run bash scripts/cjk-readings-source.sh ${lang}`);
      continue;
    }
    const parsed = LexemeReadingsFileSchema.safeParse(readJson(lexemeReadingsRel(lang)));
    if (!parsed.success) {
      errors.push(`cjk-readings ${lang}: ${lexemeReadingsRel(lang)} failed schema validation — ${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    for (const s of manifest.sources) {
      if (!parsed.data.sources.some((x) => x.id === s.id && x.sha256 === s.sha256)) {
        errors.push(`cjk-readings ${lang}: ${lexemeReadingsRel(lang)} was not derived from the pinned ${s.id} (${s.sha256}) — re-derive`);
      }
    }
    if (parsed.data.method !== manifest.method) errors.push(`cjk-readings ${lang}: the derived file's method differs from the manifest's — re-derive`);
    errors.push(...poolReadingsErrors(lang, parsed.data, loadPoolEntries(lang)));
  }
  return errors;
}
