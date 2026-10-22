/**
 * Rich-lexicon pipeline core (Phase 4, per target language since P1c).
 *
 * content/<lang>/lexicon/lexemes.json is the authoritative rich source for
 * a language's curriculum lexemes. The stable ids are SACROSANCT: this
 * module enforces a triple lock — (rich lexicon → derived surface→id map)
 * ≡ content/<lang>/lexemes.json ≡ the committed generated registry — so no
 * edit anywhere can drift an id without failing validation.
 *
 * External-source handling (Lexique 4 for French) is fail-closed: the
 * optional source manifest must carry a pinned SHA-256 with status
 * "retrieved" before any source-derived field, sourceRef, or frequency may
 * appear anywhere. While the status is "not-retrieved" (or no manifest
 * exists) the matcher reports "source-unavailable" and never invents
 * matches. Article/gender rules come from the build-time language plugin.
 */

import { existsSync } from "fs";

import {
  lexemeMapSchema,
  matchOverridesSchema,
  richLexiconSchema,
  SourceManifestSchema,
  type MatchOverrides,
  type PartOfSpeech,
  type RichLexeme,
  type RichLexicon,
  type SourceManifest,
  type SourceManifestV1,
} from "../../content/schema";
import { buildPlugin, type BuildLanguagePlugin } from "./languages";
import { isV2, manifestView } from "./lexicon-etl/manifest";
import { idsArtifactRoot, isTestOnlyTarget, loadRegistry, packsForTarget, readJson, safeResolve, type LoadedPack, type ValidationResult } from "./pipeline";

/** The committed generated registry for a language, or the frozen map itself before the first compile. */
function committedRegistryMap(code: string, frozen: Record<string, string>, testOnly: boolean): Record<string, string> {
  const rel = `${idsArtifactRoot(testOnly)}/${code}.json`;
  if (!existsSync(safeResolve(rel))) return frozen;
  return (readJson(rel) as { surfaceToId: Record<string, string> }).surfaceToId;
}

export const LEXIQUE_SOURCE_ID = "lexique-4";

export function lexiconSourcePath(lang: string): string {
  return `content/${lang}/lexicon/lexemes.json`;
}

export function hasRichLexicon(lang: string): boolean {
  return existsSync(safeResolve(lexiconSourcePath(lang)));
}

export function loadRichLexicon(lang: string): RichLexicon {
  const doc = richLexiconSchema(lang).parse(readJson(lexiconSourcePath(lang)));
  if (doc.language !== lang) throw new Error(`${lexiconSourcePath(lang)}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

/** The external-source manifest (v1 Lexique or v2 multi-source), or null when the language has no external lexical source. */
export function loadSourceManifest(lang: string): SourceManifest | null {
  const rel = `content/${lang}/lexicon/source-manifest.json`;
  if (!existsSync(safeResolve(rel))) return null;
  return SourceManifestSchema.parse(readJson(rel));
}

/** The Lexique-style (v1) manifest the French tooling consumes; a v2 manifest here is a programming error. */
export function loadSourceManifestV1(lang: string): SourceManifestV1 | null {
  const m = loadSourceManifest(lang);
  if (m === null) return null;
  if (isV2(m)) throw new Error(`content/${lang}/lexicon/source-manifest.json is a v2 (ETL) manifest — the Lexique tools only read v1`);
  return m;
}

export function loadFrozenMap(lang: string): Record<string, string> {
  return lexemeMapSchema(lang).parse(readJson(`content/${lang}/lexemes.json`));
}

/** surface → id map derived mechanically from the rich lexicon. */
export function derivedSurfaceMap(lexicon: RichLexicon): Record<string, string> {
  const map: Record<string, string> = {};
  for (const lex of lexicon.lexemes) map[lex.surface] = lex.id;
  return map;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Course glosses of one native language: surface → gloss (first occurrence wins, as authored). */
export type PackGlosses = { nativeCode: string; gloss: Map<string, string> };

export function packGlossesOf(packs: LoadedPack[]): PackGlosses[] {
  const byNative = new Map<string, Map<string, string>>();
  for (const { pack } of packs) {
    const gloss = byNative.get(pack.nativeCode) ?? new Map<string, string>();
    byNative.set(pack.nativeCode, gloss);
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const word of unit.words) {
          if (!gloss.has(word.target)) gloss.set(word.target, word.native);
        }
  }
  return [...byNative.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([nativeCode, gloss]) => ({ nativeCode, gloss }));
}

/** Pure rule engine — everything injected so tests can prove each rule fires. */
export function validateLexiconData(input: {
  plugin: BuildLanguagePlugin;
  lexicon: RichLexicon;
  /** null = the language has no external lexical source. */
  manifest: SourceManifest | null;
  frozenMap: Record<string, string>;
  runtimeMap: Record<string, string>;
  registryIds: Set<string>;
  /** Every course of the target language: its native code and surface → gloss map. */
  packGlosses: PackGlosses[];
  /**
   * §18 band boundaries from the committed population statistics; when
   * provided, every stored band must recompute from its rawValue — a band
   * that drifts from the documented derivation fails the gate.
   */
  bandThresholds?: FrequencyBandThresholds;
}): ValidationResult {
  const { plugin, lexicon, manifest, frozenMap, runtimeMap, registryIds, packGlosses, bandThresholds } = input;
  const errors: string[] = [];
  const err = (m: string) => errors.push(`lexicon: ${m}`);
  const lang = plugin.code;

  const view = manifestView(manifest);
  const externalSourceId = view?.primaryId ?? null;
  const sourceRetrieved = view?.primaryRetrieved === true;
  const byId = new Map<string, RichLexeme>();
  // P3a: every native language a course of this target is taught in must
  // have a gloss on EVERY lexeme (not only the pack words), and a draft
  // marker (`TODO:vi`) is never a gloss — the authoring toolkit fills it.
  const courseNatives = [...new Set(packGlosses.map((p) => p.nativeCode))].sort();

  // Uniqueness.
  for (const lex of lexicon.lexemes) {
    if (byId.has(lex.id)) err(`duplicate id ${lex.id}`);
    byId.set(lex.id, lex);
  }
  // P3e regional forms point at a production-variety lexeme of the same part of speech.
  for (const lex of lexicon.lexemes) {
    if (!lex.variety) continue;
    const eq = byId.get(lex.variety.equivalent);
    if (!eq) err(`${lex.id}: variety.equivalent ${lex.variety.equivalent} is not a lexeme`);
    else if (eq.variety) err(`${lex.id}: variety.equivalent ${eq.id} is itself a regional form`);
    else if (eq.partOfSpeech !== lex.partOfSpeech) err(`${lex.id}: regional form and ${eq.id} differ in part of speech`);
  }
  const surfaces = lexicon.lexemes.map((l) => l.surface);
  if (new Set(surfaces).size !== surfaces.length) err("duplicate surfaces");

  // Sacrosanct triple lock: rich-derived map ≡ frozen JSON map ≡ runtime map.
  const derived = derivedSurfaceMap(lexicon);
  const canon = (m: Record<string, string>) => JSON.stringify(Object.entries(m).sort());
  if (canon(derived) !== canon(frozenMap)) {
    err(`rich lexicon drifted from the frozen surface→id map (content/${lang}/lexemes.json) — stable ids are frozen; fix the rich source, never the map`);
  }
  if (canon(frozenMap) !== canon(runtimeMap)) {
    err(`frozen map drifted from the committed registry (src/content/ids/${lang}.json) — run bun run content:compile`);
  }

  // Cross-check against every course pack of the language: gloss identity
  // per native language and full coverage.
  for (const { nativeCode, gloss } of packGlosses) {
    for (const [target] of gloss) {
      if (derived[target] === undefined) err(`pack word "${target}" missing from rich lexicon`);
    }
    for (const lex of lexicon.lexemes) {
      const packNative = gloss.get(lex.surface);
      if (packNative === undefined) continue;
      const authored = lex.glosses[nativeCode];
      if (authored === undefined) {
        err(`${lex.id}: no "${nativeCode}" gloss but a ${lang}-${nativeCode} course teaches "${lex.surface}"`);
      } else if (authored !== packNative) {
        err(`${lex.id}: gloss "${authored}" (${nativeCode}) ≠ course gloss "${packNative}" — one truth, no drift`);
      }
    }
  }

  // Per-lexeme rules.
  const exampleCorpus = lexicon.lexemes.flatMap((l) => l.examples.map((ex) => ex.target)).join("\n");
  const articles = plugin.articleRules;

  for (const lex of lexicon.lexemes) {
    const where = lex.id;

    // Gender ⟺ noun (only meaningful where the language has grammatical gender).
    if (articles !== null && lex.partOfSpeech === "noun" && lex.gender === undefined) {
      err(`${where}: nouns must carry gender (use "unknown" only when genuinely unknown)`);
    }
    if (lex.partOfSpeech !== "noun" && lex.gender !== undefined) {
      err(`${where}: gender is meaningful on nouns only`);
    }

    // lookupForm is the surface minus its leading article — stored, verified.
    const { article, rest } = plugin.splitSurfaceArticle(lex.surface);
    if (rest !== lex.lookupForm) {
      err(`${where}: lookupForm "${lex.lookupForm}" ≠ surface minus article ("${rest}")`);
    }
    if (article !== null && lex.partOfSpeech !== "noun") {
      err(`${where}: surface carries article "${article}" but part of speech is ${lex.partOfSpeech}`);
    }

    // Article-consistency audit (course display vs authored gender). A
    // contradiction FAILS the gate — display text is never silently "fixed".
    if (article !== null && articles !== null) {
      const silent = articles.neutralBefore?.articles.includes(article) && articles.neutralBefore.noun.test(lex.lookupForm);
      const proves = silent ? undefined : articles.gender[article];
      // "both" (epicene: el/la estudiante) is consistent with either article; "unknown" never is.
      if (proves !== undefined && lex.gender !== proves && lex.gender !== "both") {
        err(`${where}: surface article "${article}" contradicts authored gender "${lex.gender}"`);
      }
    }
    // Example-sentence evidence (gendered determiners before the lookup
    // form, anywhere in the authored examples corpus) must agree too.
    if (lex.partOfSpeech === "noun" && lex.gender !== undefined && lex.gender !== "both" && lex.gender !== "unknown") {
      for (const evidence of plugin.genderEvidenceInText(exampleCorpus, lex.lookupForm)) {
        if (evidence !== lex.gender) {
          err(`${where}: example text shows a ${evidence} article before "${lex.lookupForm}" but authored gender is ${lex.gender}`);
        }
      }
    }

    // Learner-facing completeness for this file.
    if (lex.examples.length === 0) err(`${where}: at least one example is required`);
    if (lex.topic === undefined) err(`${where}: topic is required for curriculum lexemes`);
    for (const native of courseNatives) {
      const g = lex.glosses[native];
      if (g === undefined) err(`${where}: no "${native}" gloss but a ${lang}-${native} course exists — every lexeme needs it`);
      else if (/^TODO:/.test(g)) err(`${where}: "${native}" gloss is the draft marker "${g}" — a ${lang}-${native} course cannot compile until it is filled`);
      for (const [i, ex] of lex.examples.entries()) {
        const t = ex.translations[native];
        if (t === undefined) err(`${where}: example ${i} has no "${native}" translation but a ${lang}-${native} course exists`);
        else if (/^TODO:/.test(t)) err(`${where}: example ${i} "${native}" translation is the draft marker — fill it before a ${lang}-${native} course can compile`);
      }
    }

    // Source discipline.
    const refSources = [
      ...lex.sourceRefs.map((r) => r.source),
      ...lex.examples.map((ex) => ex.source),
      ...(lex.pronunciation ? [lex.pronunciation.source] : []),
      ...(lex.frequency ? [lex.frequency.source] : []),
    ];
    for (const src of refSources) {
      if (externalSourceId !== null && src === externalSourceId) {
        if (!sourceRetrieved) {
          err(`${where}: references ${externalSourceId} but the source manifest is "not-retrieved" — fail-closed`);
        }
        if (!registryIds.has(src)) {
          err(`${where}: ${externalSourceId} data present but not registered in content/sources/registry.json`);
        }
      } else if (view !== null && view.declared.has(src) && !view.retrieved.has(src)) {
        err(`${where}: references ${src} but the source manifest records it as "not-retrieved" — fail-closed`);
      } else if (!registryIds.has(src)) {
        err(`${where}: source "${src}" is not registered`);
      }
    }
    if (lex.partOfSpeech === "expression" && externalSourceId !== null && refSources.includes(externalSourceId)) {
      err(`${where}: expressions are project-authored — a ${externalSourceId} match here would be fabricated`);
    }
    // Lexique 4 ships genuine IPA in its dedicated 3_Phono_IPA column
    // (documented in content/fr/lexicon/LEXIQUE4_COLUMNS.md), so a
    // lexique-4 pronunciation MAY be labeled "ipa" — but only verbatim from
    // that column. The 2_Phono ASCII alphabet uses capitals, digits and
    // symbols that genuine IPA never contains; their presence proves a
    // mislabel and fails the gate.
    if (
      lex.pronunciation &&
      lex.pronunciation.notation === "ipa" &&
      lex.pronunciation.source === LEXIQUE_SOURCE_ID &&
      /[A-Z0-9§@°&]/.test(lex.pronunciation.value)
    ) {
      err(`${where}: lexique-4 pronunciation labeled "ipa" contains Lexique-ASCII alphabet characters — genuine IPA comes verbatim from 3_Phono_IPA only (2_Phono is notation "phonology")`);
    }
    if (lex.frequency && (externalSourceId === null || lex.frequency.source !== externalSourceId)) {
      err(
        externalSourceId === null
          ? `${where}: frequency needs a registered external measurement source (no source manifest for ${lang})`
          : `${where}: frequency must come from real ${externalSourceId} measurements only`
      );
    }
    if (lex.frequency && bandThresholds) {
      const expected = frequencyBandFor(lex.frequency.rawValue, bandThresholds);
      if (lex.frequency.band !== expected) {
        err(
          `${where}: frequency band "${lex.frequency.band}" does not recompute from rawValue ${lex.frequency.rawValue} under the population thresholds (expected "${expected}") — re-run the import`
        );
      }
    }

    // Relations: known ids, no self-reference, symmetric.
    for (const other of lex.relations?.confusables ?? []) {
      if (other === lex.id) err(`${where}: confusable self-reference`);
      const target = byId.get(other);
      if (!target) {
        err(`${where}: confusable ${other} does not exist`);
      } else if (!(target.relations?.confusables ?? []).includes(lex.id)) {
        err(`${where}: confusable ${other} is not symmetric`);
      }
    }
  }

  return { errors, warnings: [] };
}

/** Disk-reading wrapper used by the content:validate CLI, for one target language. */
export function validateLexicon(lang: string, packs: LoadedPack[]): ValidationResult {
  if (!hasRichLexicon(lang)) return { errors: [], warnings: [] };
  let lexicon: RichLexicon;
  let manifest: SourceManifest | null;
  try {
    lexicon = loadRichLexicon(lang);
  } catch (e) {
    return {
      errors: [`lexicon: ${lexiconSourcePath(lang)} failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  try {
    manifest = loadSourceManifest(lang);
  } catch (e) {
    return {
      errors: [`lexicon: content/${lang}/lexicon/source-manifest.json failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  if (!existsSync(safeResolve(`content/${lang}/lexemes.json`))) {
    return { errors: [`lexicon: content/${lang}/lexemes.json (the frozen surface→id map) is missing`], warnings: [] };
  }
  const frozenMap = loadFrozenMap(lang);
  const mine = packsForTarget(lang, packs);
  // Band thresholds come from the committed population statistics when the
  // derivation exists and matches the pinned artifact.
  let bandThresholds: FrequencyBandThresholds | undefined;
  const statsRel = `content/${lang}/lexicon/derived/frequency-stats.json`;
  const view = manifestView(manifest);
  if (view?.primaryRetrieved && existsSync(safeResolve(statsRel))) {
    const stats = readJson(statsRel) as {
      source?: { sha256?: string };
      freqLemme?: { quantiles?: Record<string, number> };
    };
    if (stats.source?.sha256 === view.primarySha256 && stats.freqLemme?.quantiles) {
      bandThresholds = bandThresholdsFromStats({ freqLemme: { quantiles: stats.freqLemme.quantiles } });
    }
  }

  const result = validateLexiconData({
    plugin: buildPlugin(lang),
    lexicon,
    manifest,
    frozenMap,
    runtimeMap: committedRegistryMap(lang, frozenMap, isTestOnlyTarget(lang, packs)),
    registryIds: new Set(loadRegistry().sources.map((s) => s.id)),
    packGlosses: packGlossesOf(mine),
    bandThresholds,
  });

  // Manual match overrides validate against the committed evidence subset.
  let overrides: MatchOverrides;
  try {
    overrides = loadMatchOverrides(lang);
  } catch (e) {
    result.errors.push(
      `match-overrides: match-overrides.json failed schema validation — ${(e as Error).message.split("\n")[0]}`
    );
    return result;
  }
  if (overrides.overrides.length > 0) {
    const subsetRel = `content/${lang}/lexicon/derived/lexique-subset.json`;
    if (!existsSync(safeResolve(subsetRel))) {
      result.errors.push(
        "match-overrides: overrides exist but the committed evidence subset is missing — run the derive step first"
      );
      return result;
    }
    const subset = readJson(subsetRel) as {
      audit?: SourceMatchRow[];
      entries?: { id: string; formRows: Record<string, string>[] }[];
    };
    const availableRowKeys = new Map<string, Set<string>>();
    for (const entry of subset.entries ?? []) {
      availableRowKeys.set(
        entry.id,
        new Set(
          entry.formRows.map((r) => [r.mot, r.cgram, r.genre, r.nombre].join("|"))
        )
      );
    }
    const overrideResult = validateMatchOverridesData({
      overrides,
      audit: subset.audit ?? [],
      availableRowKeys,
    });
    result.errors.push(...overrideResult.errors);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Lexique 4 mapping (used by the runner-side derive step and its tests)
// ---------------------------------------------------------------------------

/**
 * The REAL Lexique 4.00 column names, confirmed against the pinned artifact
 * (see content/fr/lexicon/LEXIQUE4_COLUMNS.md and derived/lexique4-recon.json).
 * All row access goes through these constants — never raw strings — so a
 * layout change fails in exactly one place.
 */
export const L4 = {
  MOT: "1_Mot",
  PHONO: "2_Phono",
  IPA: "3_Phono_IPA",
  LEMME: "4_Lemme",
  CGRAM: "5_Cgram",
  CGRAM_ORTHO: "6_CgramOrtho",
  GENRE: "7_Genre",
  NOMBRE: "8_Nombre",
  INFOVER: "9_InfoVER",
  FREQ_MOT: "10_FreqMot",
  FREQ_ORTHO: "11_FreqOrtho",
  FREQ_LEMME: "12_FreqLemme",
  CD_ORTHO: "13_CDOrtho",
  IS_LEM: "14_IsLem",
  PREVAL: "33_Preval",
  PREVAL_NB: "34_PrevalNb",
} as const;

/**
 * Deterministic mapping from Lexique `5_Cgram` values to the app's POS
 * vocabulary. Keys follow the Lexique documentation lineage (the recon
 * sample shows 15 distinct values, all covered); any value NOT in this map
 * returns null so the caller fails loudly instead of guessing, and the
 * derive step reports every unmapped value it sees (unknownCgramValues).
 */
export const LEXIQUE_CGRAM_TO_POS: Readonly<Record<string, PartOfSpeech>> = {
  NOM: "noun",
  VER: "verb",
  AUX: "verb",
  ADJ: "adjective",
  "ADJ:dem": "adjective",
  "ADJ:ind": "adjective",
  "ADJ:int": "adjective",
  "ADJ:num": "adjective",
  "ADJ:pos": "adjective",
  ADV: "adverb",
  "ART:def": "determiner",
  "ART:ind": "determiner",
  "PRO:dem": "pronoun",
  "PRO:ind": "pronoun",
  "PRO:int": "pronoun",
  "PRO:per": "pronoun",
  "PRO:pos": "pronoun",
  "PRO:rel": "pronoun",
  PRE: "preposition",
  CON: "conjunction",
  ONO: "interjection",
  INT: "interjection",
  LIA: "other",
};

export function lexiquePosFor(cgram: string): PartOfSpeech | null {
  return LEXIQUE_CGRAM_TO_POS[cgram] ?? null;
}

/**
 * `7_Genre` mapping. Lexique 4 adds "e" (épicène — either gender) to the
 * m/f of the documentation lineage; it maps to the schema's "both" and is
 * surfaced explicitly by the cross-check rather than silently satisfying an
 * authored m/f.
 */
export function lexiqueGenderFor(genre: string): "masculine" | "feminine" | "both" | "unknown" {
  if (genre === "m") return "masculine";
  if (genre === "f") return "feminine";
  if (genre === "e") return "both";
  return "unknown";
}

export type FrequencyBandThresholds = {
  /** per-million floor for "very-common" */
  veryCommon: number;
  /** per-million floor for "common" */
  common: number;
};

/**
 * §18 band boundaries, derived from the committed population statistics —
 * never hardcoded cutoffs:
 *   very-common = top 1% of the eligible lemma population (freqLemme ≥ p99)
 *   common      = top 5% (freqLemme ≥ p95)
 *   less-common = the rest
 * Rationale: the eligible population IS the learnable French lexicon
 * (~65k lemmas); its top percentile (~650 lemmas) is the core spoken
 * vocabulary tier and its top 5% (~3,250) roughly bounds a learner's
 * first years — and the split is empirically discriminative over the
 * curriculum (21/25/3 on the 49 matcher-matched core items) where
 * coarser quantiles collapse every item into one band.
 */
export function bandThresholdsFromStats(stats: {
  freqLemme: { quantiles: Record<string, number> };
}): FrequencyBandThresholds {
  const p99 = stats.freqLemme.quantiles.p99;
  const p95 = stats.freqLemme.quantiles.p95;
  if (typeof p99 !== "number" || typeof p95 !== "number") {
    throw new Error("frequency-stats quantiles are missing p99/p95 — regenerate the derived statistics");
  }
  return { veryCommon: p99, common: p95 };
}

/**
 * Frequency bands over occurrences-per-million-words. The thresholds are
 * NOT constants of this module: per the Phase 5 program they are derived
 * from the eligible-lemma-population distribution of the real source
 * (quantiles recorded in content/fr/lexicon/derived/frequency-stats.json)
 * and passed in explicitly, so an arbitrary cutoff can never masquerade as
 * a data-derived one.
 */
export function frequencyBandFor(
  perMillion: number,
  thresholds: FrequencyBandThresholds
): "very-common" | "common" | "less-common" {
  if (perMillion >= thresholds.veryCommon) return "very-common";
  if (perMillion >= thresholds.common) return "common";
  return "less-common";
}

export type LexiqueRow = Record<string, string>;

/** Strict TSV parse: every expected column must exist; no guessing. */
export function parseLexiqueTsv(text: string, expectedColumns: string[]): LexiqueRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new Error("empty source artifact");
  const header = lines[0].split("\t");
  for (const col of expectedColumns) {
    if (!header.includes(col)) {
      throw new Error(`source artifact is missing expected column "${col}" — confirm the Lexique 4 layout and update the source manifest`);
    }
  }
  return lines.slice(1).map((line) => {
    const cells = line.split("\t");
    const row: LexiqueRow = {};
    header.forEach((name, i) => {
      row[name] = cells[i] ?? "";
    });
    return row;
  });
}

export type MatchStatus =
  | "matched"
  | "unmatched"
  | "ambiguous"
  | "not-applicable"
  | "source-unavailable";

export type SourceMatchRow = {
  id: string;
  surface: string;
  lookupForm: string;
  partOfSpeech: PartOfSpeech;
  status: MatchStatus;
  /** The matched source row key (Mot|Cgram|Genre|Nombre) when "matched". */
  matchKey: string | null;
  candidateCount: number;
};

/**
 * A source row's stable identity for audit keys: one Lexique row is a
 * (form, category) reading, further split by gender/number for homograph
 * rows (e.g. "tour" NOM m vs "tour" NOM f).
 */
export function lexiqueRowKey(row: LexiqueRow): string {
  return [row[L4.MOT], row[L4.CGRAM], row[L4.GENRE], row[L4.NOMBRE]].join("|");
}

/**
 * Documented orthography fold for source matching ONLY: Lexique writes the
 * o-e ligature as the digraph ("oeuf", "coeur"), while the curriculum keeps
 * the typographically correct "œuf". The fold mirrors the app's existing
 * search-contract ligature handling; it never rewrites authored data.
 */
export function foldLexiqueOrthography(value: string): string {
  return value.replace(/œ/g, "oe").replace(/æ/g, "ae");
}

/** True when the source cell equals the curriculum form directly or under the documented ligature fold. */
export function lexiqueFormEquals(sourceValue: string | undefined, curriculumForm: string): boolean {
  const v = sourceValue ?? "";
  return v === curriculumForm || v === foldLexiqueOrthography(curriculumForm);
}

/**
 * Deterministic, fail-closed matching of curriculum lexemes against source
 * rows. The ladder narrows by form → lemma → POS, then prefers the source's
 * own canonical-lemma rows (14_IsLem), then gender for nouns (an épicène
 * "e" row is compatible with either authored gender) — NEVER frequency;
 * anything still ambiguous stays "ambiguous" and gets no metadata.
 * Expressions are project-authored and never matched.
 */
export function matchLexemes(
  lexicon: RichLexicon,
  rows: LexiqueRow[] | null
): SourceMatchRow[] {
  return lexicon.lexemes.map((lex) => {
    const base: Omit<SourceMatchRow, "status" | "matchKey" | "candidateCount"> = {
      id: lex.id,
      surface: lex.surface,
      lookupForm: lex.lookupForm,
      partOfSpeech: lex.partOfSpeech,
    };
    if (lex.partOfSpeech === "expression") {
      return { ...base, status: "not-applicable", matchKey: null, candidateCount: 0 };
    }
    if (rows === null) {
      return { ...base, status: "source-unavailable", matchKey: null, candidateCount: 0 };
    }
    const byForm = rows.filter((r) => lexiqueFormEquals(r[L4.MOT], lex.lookupForm));
    const byLemma = byForm.filter((r) => lexiqueFormEquals(r[L4.LEMME], lex.lemma));
    const byPos = byLemma.filter((r) => lexiquePosFor(r[L4.CGRAM] ?? "") === lex.partOfSpeech);
    let candidates = byPos;
    if (candidates.length > 1) {
      const lemRows = candidates.filter((r) => r[L4.IS_LEM] === "1");
      if (lemRows.length > 0) candidates = lemRows;
    }
    if (candidates.length > 1 && lex.partOfSpeech === "noun" && lex.gender && lex.gender !== "unknown") {
      const byGender = candidates.filter((r) => {
        const g = lexiqueGenderFor(r[L4.GENRE] ?? "");
        return g === lex.gender || g === "both";
      });
      if (byGender.length > 0) candidates = byGender;
    }
    if (candidates.length === 1) {
      return {
        ...base,
        status: "matched",
        matchKey: lexiqueRowKey(candidates[0]),
        candidateCount: 1,
      };
    }
    return {
      ...base,
      status: candidates.length === 0 ? "unmatched" : "ambiguous",
      matchKey: null,
      candidateCount: candidates.length,
    };
  });
}

/**
 * The source-match audit for a language. Without an artifact (the
 * committed state while the manifest is "not-retrieved" or absent) every
 * matchable lexeme reports "source-unavailable"; the developer-side
 * extractor passes real parsed rows and regenerates the committed audit at
 * retrieval time.
 */
export function lexiconSourceAudit(lexicon: RichLexicon, rows: LexiqueRow[] | null = null): SourceMatchRow[] {
  return matchLexemes(lexicon, rows);
}

// ---------------------------------------------------------------------------
// Manual match overrides (§15 dispositions for matcher-unresolvable items)
// ---------------------------------------------------------------------------

export function loadMatchOverrides(lang: string): MatchOverrides {
  const rel = `content/${lang}/lexicon/match-overrides.json`;
  if (!existsSync(safeResolve(rel))) return { version: 1, overrides: [] };
  return matchOverridesSchema(lang).parse(readJson(rel));
}

/**
 * Pure override validation: an override may only resolve what the strict
 * matcher genuinely cannot (unmatched/ambiguous — never expressions, never
 * already-matched items), and must adopt a row that really exists in the
 * committed evidence subset for that lexeme.
 */
export function validateMatchOverridesData(input: {
  overrides: MatchOverrides;
  audit: SourceMatchRow[];
  /** lexeme id → row keys present in its committed evidence formRows. */
  availableRowKeys: Map<string, Set<string>>;
}): ValidationResult {
  const { overrides, audit, availableRowKeys } = input;
  const errors: string[] = [];
  const err = (m: string) => errors.push(`match-overrides: ${m}`);
  const auditById = new Map(audit.map((r) => [r.id, r]));
  const seen = new Set<string>();
  for (const override of overrides.overrides) {
    if (seen.has(override.id)) err(`duplicate override for ${override.id}`);
    seen.add(override.id);
    const row = auditById.get(override.id);
    if (!row) {
      err(`${override.id} is not a known lexeme`);
      continue;
    }
    if (row.status === "matched") {
      err(`${override.id} is already matched by the strict matcher — a redundant override hides drift`);
    } else if (row.status === "not-applicable") {
      err(`${override.id} is an expression — never lexique-matched, not even by override`);
    } else if (row.status === "source-unavailable") {
      err(`${override.id}: no evidence rows exist to adopt (source-unavailable)`);
    }
    const available = availableRowKeys.get(override.id) ?? new Set();
    if ((row.status === "unmatched" || row.status === "ambiguous") && !available.has(override.matchKey)) {
      err(
        `${override.id}: matchKey "${override.matchKey}" is not among the committed evidence rows for this lexeme (${[...available].join(", ") || "none"})`
      );
    }
  }
  return { errors, warnings: [] };
}

/**
 * The effective match table the importer consumes: strict-matcher results
 * plus validated manual overrides, each entry labeled with its provenance.
 */
export function effectiveMatchKeys(
  audit: SourceMatchRow[],
  overrides: MatchOverrides
): Map<string, { matchKey: string; via: "matcher" | "override" }> {
  const map = new Map<string, { matchKey: string; via: "matcher" | "override" }>();
  for (const row of audit) {
    if (row.status === "matched" && row.matchKey !== null) {
      map.set(row.id, { matchKey: row.matchKey, via: "matcher" });
    }
  }
  for (const override of overrides.overrides) {
    map.set(override.id, { matchKey: override.matchKey, via: "override" });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Authoring-only candidate pool (never learner-visible)
// ---------------------------------------------------------------------------

export type CandidateEntry = {
  lemma: string;
  partOfSpeech: PartOfSpeech;
  gender: "masculine" | "feminine" | "both" | "unknown" | null;
  /** Genuine IPA from 3_Phono_IPA, verbatim. */
  ipa: string;
  /** 12_FreqLemme — lemma subtitle frequency per million (primary ranking). */
  freqLemme: number;
  /** 13_CDOrtho — contextual diversity of the lemma's own form. */
  cdOrtho: number;
  /** 33_Preval — prevalence where present (null when the column is empty). */
  preval: number | null;
  /** True when the (lemma, POS) pair is already an authored curriculum lexeme. */
  alreadyAuthored: boolean;
  /** 1-based rank under the documented ordering (the §23 "source rank"). */
  sourceRank: number;
  /** Human-readable §23 selection reason (authoring aid, never learner-visible). */
  selectionReason: string;
};

export const CANDIDATE_POOL_SIZE = 1500;
export const CANDIDATE_POS: readonly PartOfSpeech[] = ["noun", "verb", "adjective", "adverb"];

/**
 * The authoring pool draws from PLAIN lexical categories only. The mapped
 * POS is not enough here: ADJ:pos/ADJ:dem etc. map to "adjective" but are
 * closed-class function words (mon, ce, cette…) that would flood the top
 * frequency ranks of a vocabulary-authoring list (observed in the first
 * real derivation: eleven of the top thirty). Grammar words are taught by
 * the pedagogy units, not authored as vocabulary candidates.
 */
export const CANDIDATE_PLAIN_CGRAM = new Set(["NOM", "VER", "ADJ", "ADV"]);

/**
 * Quality guard against source lemmatization artifacts, corroborated by
 * contextual diversity: a lemma claiming ≥ 20 occurrences per million while
 * its own canonical form appears in under 0.05% of the 65k subtitle
 * documents is physically incoherent — the lemma frequency belongs to a
 * different word. Observed real cases: "upas" (freqLemme 18098.6 inherited
 * from "pas", CD 0.014, prevalence 0) and "garçonne" (431.8, CD 0.037).
 * Exclusions are RECORDED in the pool artifact, never silent.
 */
export function failsCdCorroboration(freqLemme: number, cdOrtho: number): boolean {
  return freqLemme >= 20 && cdOrtho < 0.05;
}

/**
 * Single-word lowercase French form: letters/accents/œ/æ with internal
 * hyphens or apostrophes. Filters proper nouns (capitalized) and multiword
 * rows from lemma populations.
 */
export const LEXIQUE_WORD_SHAPE = /^[a-zàâäéèêëîïôöùûüÿçœæ]+(?:[-'][a-zàâäéèêëîïôöùûüÿçœæ]+)*$/;

export type CandidatePool = {
  entries: CandidateEntry[];
  /** CD-corroboration exclusions, recorded for transparency (§24). */
  excludedByQualityGuard: {
    lemma: string;
    partOfSpeech: PartOfSpeech;
    freqLemme: number;
    cdOrtho: number;
    reason: string;
  }[];
};

/**
 * Documented deterministic selection for the authoring-only candidate pool
 * (never curriculum, never cards, never learner-visible — no translations
 * are fabricated for it):
 *  1. keep rows whose 5_Cgram is a PLAIN lexical category (NOM/VER/ADJ/ADV
 *     — see CANDIDATE_PLAIN_CGRAM: subcategorized function words like
 *     ADJ:pos "mon" are grammar material, not vocabulary candidates);
 *  2. keep the source's own canonical lemma rows only (14_IsLem = 1);
 *  3. keep single-word lowercase forms (letters, accents, œ/æ, internal
 *     hyphens or apostrophes) — filters proper nouns and multiword rows;
 *  4. dedupe by (lemma, POS) keeping the highest 12_FreqLemme;
 *  5. drop rows failing CD corroboration (failsCdCorroboration — source
 *     lemmatization artifacts), RECORDING each exclusion;
 *  6. order by 12_FreqLemme descending (the only genuinely lemma-level
 *     frequency variable — see LEXIQUE4_COLUMNS.md), tie-broken
 *     alphabetically, and take the first `size` entries.
 * Contextual diversity and prevalence ride along as quality signals for the
 * human authoring pass; they never reorder the pool silently.
 */
export function selectCandidatePool(
  rows: LexiqueRow[],
  size: number = CANDIDATE_POOL_SIZE,
  authoredKeys: ReadonlySet<string> = new Set()
): CandidatePool {
  const wordShape = LEXIQUE_WORD_SHAPE;
  type Picked = Omit<CandidateEntry, "sourceRank" | "selectionReason">;
  const best = new Map<string, Picked>();
  for (const row of rows) {
    const cgram = row[L4.CGRAM] ?? "";
    if (!CANDIDATE_PLAIN_CGRAM.has(cgram)) continue;
    const pos = lexiquePosFor(cgram);
    if (pos === null || !CANDIDATE_POS.includes(pos)) continue;
    if (row[L4.IS_LEM] !== "1") continue;
    const lemma = row[L4.MOT] ?? "";
    if (lemma === "" || !wordShape.test(lemma)) continue;
    const freqLemme = Number(row[L4.FREQ_LEMME] ?? "");
    if (!Number.isFinite(freqLemme)) continue;
    const key = `${lemma}|${pos}`;
    const existing = best.get(key);
    if (existing === undefined || freqLemme > existing.freqLemme) {
      const cdOrtho = Number(row[L4.CD_ORTHO] ?? "");
      const prevalRaw = row[L4.PREVAL] ?? "";
      const preval = prevalRaw === "" ? null : Number(prevalRaw);
      best.set(key, {
        lemma,
        partOfSpeech: pos,
        gender: pos === "noun" ? lexiqueGenderFor(row[L4.GENRE] ?? "") : null,
        ipa: row[L4.IPA] ?? "",
        freqLemme,
        cdOrtho: Number.isFinite(cdOrtho) ? cdOrtho : 0,
        preval: preval !== null && Number.isFinite(preval) ? preval : null,
        alreadyAuthored: authoredKeys.has(key),
      });
    }
  }
  const excludedByQualityGuard: CandidatePool["excludedByQualityGuard"] = [];
  const kept: Picked[] = [];
  for (const entry of best.values()) {
    if (failsCdCorroboration(entry.freqLemme, entry.cdOrtho)) {
      excludedByQualityGuard.push({
        lemma: entry.lemma,
        partOfSpeech: entry.partOfSpeech,
        freqLemme: entry.freqLemme,
        cdOrtho: entry.cdOrtho,
        reason:
          "CD corroboration failed: claimed lemma frequency is top-tier while the canonical form appears in under 0.05% of documents — source lemmatization artifact",
      });
      continue;
    }
    kept.push(entry);
  }
  excludedByQualityGuard.sort((a, b) => b.freqLemme - a.freqLemme || a.lemma.localeCompare(b.lemma, "fr"));
  const entries = kept
    .sort((a, b) => b.freqLemme - a.freqLemme || a.lemma.localeCompare(b.lemma, "fr"))
    .slice(0, size)
    .map((entry, i) => ({
      ...entry,
      sourceRank: i + 1,
      selectionReason:
        `rank ${i + 1} by lemma subtitle frequency (${entry.freqLemme}/M); ` +
        `CD ${entry.cdOrtho}; prevalence ${entry.preval ?? "n/a"}` +
        (entry.alreadyAuthored ? "; already authored in the 54-core" : ""),
    }));
  return { entries, excludedByQualityGuard };
}

/** (lemma, POS) keys of the authored curriculum lexemes, for pool flagging. */
export function authoredLemmaPosKeys(lexicon: RichLexicon): Set<string> {
  const keys = new Set<string>();
  for (const lex of lexicon.lexemes) {
    if (lex.partOfSpeech === "expression") continue;
    keys.add(`${lex.lemma}|${lex.partOfSpeech}`);
  }
  return keys;
}
